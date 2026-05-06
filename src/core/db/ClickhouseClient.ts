import type { ClickHouseClient } from '@clickhouse/client';
import { createClient } from '@clickhouse/client';

import type { ColumnInfo, IDbClient } from './IDbClient';
import { assertReadOnly } from './IDbClient';
import type { DbConnection } from './types';

export class ClickhouseClient implements IDbClient {
  private client: ClickHouseClient | null = null;

  constructor(private readonly conn: DbConnection) {}

  async connect(): Promise<void> {
    const host = this.conn.host.replace(/^https?:\/\//, '');
    this.client = createClient({
      url: `http://${host}:${this.conn.port}`,
      username: this.conn.user,
      password: this.conn.password,
      database: this.conn.database || undefined,
      request_timeout: 10_000,
    });
    // Validate connection
    await this.client.ping();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  async listDatabases(): Promise<string[]> {
    const rows = await this.raw<{ name: string }>('SHOW DATABASES');
    return rows.map((r) => r.name);
  }

  async listTables(database?: string): Promise<string[]> {
    const db = database ?? this.conn.database;
    // Use system.tables for reliable cross-version compatibility
    const sql = db
      ? `SELECT name FROM system.tables WHERE database = '${db.replace(/'/g, "''")}'`
      : 'SHOW TABLES';
    const rows = await this.raw<{ name: string }>(sql);
    return rows.map((r) => r.name);
  }

  async describeTable(tableName: string): Promise<ColumnInfo[]> {
    if (!/^[\w.'`]+$/.test(tableName)) throw new Error('Invalid table name');
    const rows = await this.raw<{
      name: string;
      type: string;
      default_type: string;
      default_expression: string;
      comment: string;
      codec_expression: string;
    }>(`DESCRIBE TABLE ${tableName}`);
    // Normalize ClickHouse column format to the common ColumnInfo shape
    return rows.map((r) => ({
      Field: r.name,
      Type: r.type,
      Null: r.type.startsWith('Nullable(') ? 'YES' : 'NO',
      Key: '',
      Default: r.default_expression || null,
      Extra: [r.default_type, r.codec_expression, r.comment].filter(Boolean).join(', '),
    }));
  }

  async query(sql: string): Promise<Record<string, unknown>[]> {
    assertReadOnly(sql);
    return this.raw(sql);
  }

  private async raw<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    if (!this.client) throw new Error('DB에 연결되지 않았습니다.');
    const result = await this.client.query({ query: sql, format: 'JSONEachRow' });
    return result.json<T>();
  }
}
