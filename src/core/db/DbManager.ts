import type { McpServerManager } from '../mcp/McpServerManager';
import type { DbConnectionStorage } from '../storage/DbConnectionStorage';
import { DbMcpServer } from './DbMcpServer';
import type { DbConnection } from './types';

interface RunningServer {
  server: DbMcpServer;
  port: number;
}

/** MCP server name prefix for DB connections (kept out of user-visible MCP list). */
const DB_MCP_PREFIX = '__db_';

export class DbManager {
  private running = new Map<string, RunningServer>();
  private connections: DbConnection[] = [];

  constructor(
    private readonly storage: DbConnectionStorage,
    private readonly mcpManager: McpServerManager
  ) {}

  async initialize(): Promise<void> {
    this.connections = await this.storage.load();
    for (const conn of this.connections) {
      if (conn.enabled) {
        await this.startServer(conn).catch(() => {
          // Connection failed at startup — mark disabled so UI reflects reality
          conn.enabled = false;
        });
      }
    }
  }

  async destroy(): Promise<void> {
    for (const { server } of this.running.values()) {
      await server.stop().catch(() => undefined);
    }
    this.running.clear();
  }

  getConnections(): DbConnection[] {
    return [...this.connections];
  }

  /** Persist updated connection list (called by settings UI). */
  async saveConnections(connections: DbConnection[]): Promise<void> {
    this.connections = connections;
    await this.storage.save(connections);
  }

  async enableConnection(id: string): Promise<void> {
    const conn = this.connections.find((c) => c.id === id);
    if (!conn || this.running.has(id)) return;
    await this.startServer(conn);
    conn.enabled = true;
    await this.storage.save(this.connections);
  }

  async disableConnection(id: string): Promise<void> {
    const entry = this.running.get(id);
    if (entry) {
      await entry.server.stop().catch(() => undefined);
      this.running.delete(id);
    }
    this.mcpManager.removeRuntimeServer(`${DB_MCP_PREFIX}${id}`);
    const conn = this.connections.find((c) => c.id === id);
    if (conn) {
      conn.enabled = false;
      await this.storage.save(this.connections);
    }
  }

  isRunning(id: string): boolean {
    return this.running.has(id);
  }

  private async startServer(conn: DbConnection): Promise<void> {
    const server = new DbMcpServer(conn);
    const port = await server.start();
    this.running.set(conn.id, { server, port });
    this.mcpManager.addRuntimeServer(`${DB_MCP_PREFIX}${conn.id}`, {
      type: 'sse',
      url: `http://127.0.0.1:${port}/sse`,
    });
  }
}
