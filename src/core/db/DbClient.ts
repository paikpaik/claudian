import type { Pool, RowDataPacket } from 'mysql2/promise';
import * as mysql from 'mysql2/promise';

import type { DbConnection } from './types';

/** SQL statements that modify data — always blocked in read-only mode. */
const WRITE_PATTERN =
  /^\s*(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|REPLACE|MERGE|RENAME|LOCK|UNLOCK|GRANT|REVOKE|CALL|EXECUTE|LOAD)\b/i;

export class DbClient {
  private pool: Pool | null = null;

  async connect(conn: DbConnection): Promise<void> {
    const config: mysql.PoolOptions = {
      host: conn.host,
      port: conn.port,
      user: conn.user,
      password: conn.password,
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 10_000,
    };
    // database는 선택사항 — 비어있으면 서버 레벨로 연결
    if (conn.database) config.database = conn.database;
    this.pool = mysql.createPool(config);
    await this.pool!.query('SELECT 1');
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async listDatabases(): Promise<string[]> {
    const rows = await this.executeRaw('SHOW DATABASES');
    return rows.map((r) => Object.values(r)[0] as string);
  }

  async listTables(database?: string): Promise<string[]> {
    const sql = database ? `SHOW TABLES FROM \`${database.replace(/`/g, '``')}\`` : 'SHOW TABLES';
    const rows = await this.executeRaw(sql);
    return rows.map((r) => Object.values(r)[0] as string);
  }

  async describeTable(tableName: string): Promise<RowDataPacket[]> {
    // tableName may be db.table or just table
    if (!/^[\w.`]+$/.test(tableName)) throw new Error('Invalid table name');
    const safe = tableName.replace(/`/g, '``');
    return this.executeRaw(`DESCRIBE \`${safe}\``);
  }

  /** Read-only query execution. Throws on any write statement. */
  async query(sql: string): Promise<RowDataPacket[]> {
    const trimmed = sql.trim();
    if (WRITE_PATTERN.test(trimmed)) {
      const keyword = trimmed.split(/\s+/)[0].toUpperCase();
      throw new Error(
        `읽기 전용 모드: ${keyword} 구문은 허용되지 않습니다. SELECT, SHOW, DESCRIBE, EXPLAIN만 사용할 수 있습니다.`
      );
    }
    return this.executeRaw(sql);
  }

  private async executeRaw(sql: string): Promise<RowDataPacket[]> {
    if (!this.pool) throw new Error('DB에 연결되지 않았습니다.');
    const [rows] = await this.pool.query<RowDataPacket[]>(sql);
    return rows;
  }
}
