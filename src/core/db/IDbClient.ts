export interface ColumnInfo {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

export interface IDbClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  listDatabases(): Promise<string[]>;
  listTables(database?: string): Promise<string[]>;
  describeTable(tableName: string): Promise<ColumnInfo[]>;
  /** Read-only. Throws on any write statement. */
  query(sql: string): Promise<Record<string, unknown>[]>;
}

/** SQL statements that modify data — always blocked. */
export const WRITE_PATTERN =
  /^\s*(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|REPLACE|MERGE|RENAME|LOCK|UNLOCK|GRANT|REVOKE|CALL|EXECUTE|LOAD)\b/i;

export function assertReadOnly(sql: string): void {
  const trimmed = sql.trim();
  if (WRITE_PATTERN.test(trimmed)) {
    const keyword = trimmed.split(/\s+/)[0].toUpperCase();
    throw new Error(
      `읽기 전용 모드: ${keyword} 구문은 허용되지 않습니다. SELECT, SHOW, DESCRIBE, EXPLAIN만 사용할 수 있습니다.`
    );
  }
}
