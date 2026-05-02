import type { Pool } from 'mysql2/promise';
import * as mysql from 'mysql2/promise';

import type { ColumnInfo, IDbClient } from './IDbClient';
import { assertReadOnly } from './IDbClient';
import type { DbConnection } from './types';

export class MySqlClient implements IDbClient {
  private pool: Pool | null = null;

  constructor(private readonly conn: DbConnection) {}

  async connect(): Promise<void> {
    const config: mysql.PoolOptions = {
      host: this.conn.host,
      port: this.conn.port,
      user: this.conn.user,
      password: this.conn.password,
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 10_000,
    };
    if (this.conn.database) config.database = this.conn.database;
    this.pool = mysql.createPool(config);
    await this.pool.query('SELECT 1');
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async listDatabases(): Promise<string[]> {
    const rows = await this.raw('SHOW DATABASES');
    return rows.map((r) => Object.values(r)[0] as string);
  }

  async listTables(database?: string): Promise<string[]> {
    const sql = database
      ? `SHOW TABLES FROM \`${database.replace(/`/g, '``')}\``
      : 'SHOW TABLES';
    const rows = await this.raw(sql);
    return rows.map((r) => Object.values(r)[0] as string);
  }

  async describeTable(tableName: string): Promise<ColumnInfo[]> {
    if (!/^[\w.`]+$/.test(tableName)) throw new Error('Invalid table name');
    const safe = tableName.replace(/`/g, '``');
    return this.raw(`DESCRIBE \`${safe}\``) as unknown as Promise<ColumnInfo[]>;
  }

  async query(sql: string): Promise<Record<string, unknown>[]> {
    assertReadOnly(sql);
    return this.raw(sql);
  }

  private async raw(sql: string): Promise<Record<string, unknown>[]> {
    if (!this.pool) throw new Error('DB에 연결되지 않았습니다.');
    const [rows] = await this.pool.query(sql);
    return rows as Record<string, unknown>[];
  }
}
