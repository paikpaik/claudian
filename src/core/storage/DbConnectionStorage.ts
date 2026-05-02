import type { DbConnection } from '../db/types';
import type { VaultFileAdapter } from './VaultFileAdapter';

export const DB_CONNECTIONS_PATH = '.claude/db-connections.json';

export class DbConnectionStorage {
  constructor(private readonly adapter: VaultFileAdapter) {}

  async load(): Promise<DbConnection[]> {
    try {
      if (!(await this.adapter.exists(DB_CONNECTIONS_PATH))) return [];
      const content = await this.adapter.read(DB_CONNECTIONS_PATH);
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) return [];
      return parsed as DbConnection[];
    } catch {
      return [];
    }
  }

  async save(connections: DbConnection[]): Promise<void> {
    await this.adapter.write(DB_CONNECTIONS_PATH, JSON.stringify(connections, null, 2));
  }
}
