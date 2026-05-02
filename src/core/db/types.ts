export type DbConnectionType = 'mysql' | 'clickhouse';

export interface DbConnection {
  id: string;
  name: string;
  type: DbConnectionType;
  host: string;
  port: number;
  user: string;
  password: string;
  /** 비워두면 서버 전체에 접근 (cross-database 쿼리 가능). */
  database?: string;
  enabled: boolean;
}
