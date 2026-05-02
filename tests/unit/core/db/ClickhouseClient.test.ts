import { ClickhouseClient } from '../../../../src/core/db/ClickhouseClient';

const mockJson = jest.fn();
const mockQuery = jest.fn().mockResolvedValue({ json: mockJson });
const mockPing = jest.fn().mockResolvedValue(true);
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.mock('@clickhouse/client', () => ({
  createClient: () => ({ query: mockQuery, ping: mockPing, close: mockClose }),
}));

const conn = {
  id: '1',
  name: 'test',
  type: 'clickhouse' as const,
  host: 'localhost',
  port: 8123,
  user: 'default',
  password: '',
  enabled: false,
};

describe('ClickhouseClient', () => {
  let client: ClickhouseClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    client = new ClickhouseClient(conn);
    await client.connect();
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('describeTable', () => {
    it('maps ClickHouse column format to ColumnInfo', async () => {
      mockJson.mockResolvedValue([
        {
          name: 'id',
          type: 'UInt64',
          default_type: '',
          default_expression: '',
          comment: '',
          codec_expression: '',
        },
        {
          name: 'created_at',
          type: 'Nullable(DateTime)',
          default_type: 'DEFAULT',
          default_expression: 'now()',
          comment: 'creation time',
          codec_expression: '',
        },
      ]);

      const result = await client.describeTable('events');

      expect(result).toEqual([
        { Field: 'id', Type: 'UInt64', Null: 'NO', Key: '', Default: null, Extra: '' },
        {
          Field: 'created_at',
          Type: 'Nullable(DateTime)',
          Null: 'YES',
          Key: '',
          Default: 'now()',
          Extra: 'DEFAULT, creation time',
        },
      ]);
    });

    it('uses DESCRIBE TABLE query', async () => {
      mockJson.mockResolvedValue([]);
      await client.describeTable('my_table');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'DESCRIBE TABLE my_table' })
      );
    });

    it('rejects invalid table names', async () => {
      await expect(client.describeTable('table; DROP TABLE')).rejects.toThrow('Invalid table name');
    });
  });

  describe('listTables', () => {
    it('queries system.tables when database is specified', async () => {
      mockJson.mockResolvedValue([{ name: 't1' }, { name: 't2' }]);
      const tables = await client.listTables('mydb');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "SELECT name FROM system.tables WHERE database = 'mydb'",
        })
      );
      expect(tables).toEqual(['t1', 't2']);
    });

    it('uses SHOW TABLES when no database is given', async () => {
      mockJson.mockResolvedValue([{ name: 'orders' }]);
      await client.listTables();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'SHOW TABLES' })
      );
    });

    it('escapes single quotes in database name', async () => {
      mockJson.mockResolvedValue([]);
      await client.listTables("db'name");
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "SELECT name FROM system.tables WHERE database = 'db''name'",
        })
      );
    });
  });

  describe('listDatabases', () => {
    it('returns database names from SHOW DATABASES', async () => {
      mockJson.mockResolvedValue([{ name: 'default' }, { name: 'system' }]);
      const dbs = await client.listDatabases();
      expect(dbs).toEqual(['default', 'system']);
    });
  });

  describe('query', () => {
    it('blocks write statements', async () => {
      await expect(client.query('DROP TABLE foo')).rejects.toThrow('읽기 전용 모드');
      await expect(client.query('INSERT INTO foo VALUES (1)')).rejects.toThrow('읽기 전용 모드');
    });

    it('allows SELECT queries', async () => {
      mockJson.mockResolvedValue([{ count: 10 }]);
      const rows = await client.query('SELECT count() FROM events');
      expect(rows).toEqual([{ count: 10 }]);
    });
  });
});
