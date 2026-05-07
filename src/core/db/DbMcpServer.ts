import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as http from 'http';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import type { IDbClient } from './IDbClient';
import { assertReadOnly } from './IDbClient';
import type { DbConnection } from './types';

export class DbMcpServer {
  private mcpServer: Server;
  private httpServer: http.Server;
  private transports = new Map<string, SSEServerTransport>();
  private client: IDbClient;

  constructor(
    private readonly connection: DbConnection,
    client: IDbClient,
    private readonly vaultPath: string = '',
    private readonly onExport: (filePath: string) => void = () => {},
  ) {
    this.client = client;
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
            properties: {
              sql: { type: 'string', description: '실행할 읽기 전용 SQL' },
              filename: { type: 'string', description: '저장할 파일명 (snake_case, 예: ticket_usage). 쿼리 내용을 반영해 제공하세요.' },
            },
            required: ['sql'],
          },
        },
        {
          name: 'export_data',
          description:
            'SQL 쿼리 결과를 Desktop의 CSV 파일과 vault의 마크다운 노트로 저장합니다. 결과 데이터를 컨텍스트에 올리지 않아 토큰을 절약합니다. 데이터를 파일로 내보낼 때 사용하세요.',
          inputSchema: {
            type: 'object',
            properties: {
              sql: { type: 'string', description: '실행할 SELECT 쿼리' },
              title: { type: 'string', description: '파일 제목 (생략 시 자동 생성)' },
            },
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
            if (rows.length === 0) {
              return { content: [{ type: 'text', text: '(결과 없음)' }] };
            }
            let savedFile = '';
            if (this.vaultPath) {
              const base = args?.filename
                ? String(args.filename).replace(/[^\w가-힣]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 40)
                : 'query';
              savedFile = `${base}_${toKstTimestamp()}.csv`;
              await fs.writeFile(path.join(this.vaultPath, savedFile), toCsv(rows), 'utf-8');
            }
            const hint = savedFile ? `\n\n📄 CSV 저장됨: ${savedFile}` : '';
            return { content: [{ type: 'text', text: `${JSON.stringify(rows, null, 2)}${hint}` }] };
          }
          case 'export_data': {
            const sql = String(args?.sql ?? '');
            assertReadOnly(sql);
            const rows = await this.client.query(sql);

            const title = args?.title ? String(args.title) : 'export';
            const safeTitle = title.replace(/[^\w가-힣]/g, '-').replace(/-+/g, '-').slice(0, 40);
            const fileName = `claudian-${safeTitle}-${toKstTimestamp()}`;

            const csvPath = path.join(os.homedir(), 'Desktop', `${fileName}.csv`);
            await fs.writeFile(csvPath, toCsv(rows), 'utf-8');

            const parts = [`CSV: ${csvPath}`];
            if (this.vaultPath) {
              const mdPath = path.join(this.vaultPath, `${fileName}.md`);
              const md = `# ${title}\n\n\`\`\`sql\n${sql}\n\`\`\`\n\n${toMarkdownTable(rows)}\n`;
              await fs.writeFile(mdPath, md, 'utf-8');
              parts.push(`노트: ${mdPath}`);
            }

            this.onExport(csvPath);
            return {
              content: [{ type: 'text', text: `저장 완료 (${rows.length}행)\n${parts.join('\n')}` }],
            };
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
    await this.client.connect();
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

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => escape(r[c])).join(','))].join('\n');
}

function toMarkdownTable(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '(결과 없음)';
  const cols = Object.keys(rows[0]);
  return [
    `| ${cols.join(' | ')} |`,
    `| ${cols.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${cols.map((c) => String(r[c] ?? '')).join(' | ')} |`),
  ].join('\n');
}

function toKstTimestamp(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 16).replace('T', '_').replace(':', '_').replace(/-/g, '_');
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
