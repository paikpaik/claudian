import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as http from 'http';
import * as net from 'net';

import { DbClient } from './DbClient';
import type { DbConnection } from './types';

export class DbMcpServer {
  private mcpServer: Server;
  private httpServer: http.Server;
  private transports = new Map<string, SSEServerTransport>();
  private client = new DbClient();

  constructor(private readonly connection: DbConnection) {
    this.mcpServer = new Server(
      { name: `claudian-db-${connection.name}`, version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.registerTools();
    this.httpServer = this.buildHttpServer();
  }

  private registerTools(): void {
    const hasDefaultDb = Boolean(this.connection.database);

    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_databases',
          description: '접근 가능한 데이터베이스 목록을 반환합니다.',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'list_tables',
          description: hasDefaultDb
            ? `기본 데이터베이스(${this.connection.database})의 테이블 목록을 반환합니다. database 파라미터로 다른 DB를 지정할 수 있습니다.`
            : 'database 파라미터로 지정한 DB의 테이블 목록을 반환합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              database: {
                type: 'string',
                description: '조회할 데이터베이스 이름 (생략 시 기본 DB 사용)',
              },
            },
          },
        },
        {
          name: 'describe_table',
          description:
            '테이블의 컬럼 구조(이름, 타입, 키, 기본값 등)를 반환합니다. 다른 DB의 테이블은 db_name.table_name 형식으로 지정합니다.',
          inputSchema: {
            type: 'object',
            properties: {
              table_name: {
                type: 'string',
                description: '테이블 이름 또는 db_name.table_name',
              },
            },
            required: ['table_name'],
          },
        },
        {
          name: 'query',
          description:
            'SELECT, SHOW, DESCRIBE, EXPLAIN 쿼리만 실행합니다. INSERT/UPDATE/DELETE/DROP 등 데이터 변경 쿼리는 차단됩니다. 크로스 DB 쿼리는 db_name.table_name 형식으로 사용합니다.',
          inputSchema: {
            type: 'object',
            properties: { sql: { type: 'string', description: '실행할 읽기 전용 SQL' } },
            required: ['sql'],
          },
        },
      ],
    }));

    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        switch (name) {
          case 'list_databases': {
            const dbs = await this.client.listDatabases();
            return { content: [{ type: 'text', text: dbs.join('\n') }] };
          }
          case 'list_tables': {
            const db = args?.database ? String(args.database) : undefined;
            const tables = await this.client.listTables(db);
            return { content: [{ type: 'text', text: tables.join('\n') }] };
          }
          case 'describe_table': {
            const rows = await this.client.describeTable(String(args?.table_name ?? ''));
            return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
          }
          case 'query': {
            const rows = await this.client.query(String(args?.sql ?? ''));
            const text = rows.length === 0 ? '(결과 없음)' : JSON.stringify(rows, null, 2);
            return { content: [{ type: 'text', text }] };
          }
          default:
            throw new Error(`알 수 없는 도구: ${name}`);
        }
      } catch (err) {
        return {
          content: [{ type: 'text', text: `오류: ${(err as Error).message}` }],
          isError: true,
        };
      }
    });
  }

  private buildHttpServer(): http.Server {
    return http.createServer(async (req, res) => {
      if (req.method === 'GET' && req.url?.startsWith('/sse')) {
        const transport = new SSEServerTransport('/messages', res);
        this.transports.set(transport.sessionId, transport);
        transport.onclose = () => this.transports.delete(transport.sessionId);
        await this.mcpServer.connect(transport);
        return;
      }

      if (req.method === 'POST' && req.url?.startsWith('/messages')) {
        const sessionId = new URL(req.url, 'http://localhost').searchParams.get('sessionId');
        const transport = sessionId ? this.transports.get(sessionId) : undefined;
        if (transport) {
          await transport.handlePostMessage(req, res);
        } else {
          res.writeHead(404).end('Session not found');
        }
        return;
      }

      res.writeHead(404).end();
    });
  }

  async start(): Promise<number> {
    await this.client.connect(this.connection);
    const port = await findFreePort(27400);
    await new Promise<void>((resolve, reject) => {
      this.httpServer.listen(port, '127.0.0.1', resolve).once('error', reject);
    });
    return port;
  }

  async stop(): Promise<void> {
    await this.client.disconnect();
    for (const [, transport] of this.transports) {
      transport.onclose?.();
    }
    this.transports.clear();
    await new Promise<void>((resolve) => this.httpServer.close(() => resolve()));
  }
}

function findFreePort(from: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(from, '127.0.0.1', () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.once('error', () =>
      findFreePort(from + 1).then(resolve).catch(reject)
    );
  });
}
