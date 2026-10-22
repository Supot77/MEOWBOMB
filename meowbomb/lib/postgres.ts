import 'server-only';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';

let pool: Pool | undefined;
function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('ยังไม่ได้ตั้งค่า DATABASE_URL ในเซิร์ฟเวอร์');
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, idleTimeoutMillis: 5000, connectionTimeoutMillis: 10000 });
    if (process.env.VERCEL) attachDatabasePool(pool);
  }
  return pool;
}

// Keep the existing atomic revision checks while adapting the room store to Postgres.
// All table references are schema-qualified so a shared database stays isolated.
export function roomSql(sql: string) {
  let index = 0;
  return sql.replace(/INSERT OR IGNORE INTO rooms/, 'INSERT INTO meowbomb.rooms')
    .replace(/\bFROM rooms\b/g, 'FROM meowbomb.rooms')
    .replace(/\bUPDATE rooms\b/g, 'UPDATE meowbomb.rooms')
    .replace(/\?/g, () => `$${++index}`)
    + (sql.startsWith('INSERT OR IGNORE') ? ' ON CONFLICT (code) DO NOTHING' : '');
}

export function getRoomDatabase() {
  return { prepare(sql: string) {
    return { bind(...values: unknown[]) {
      const execute = () => getPool().query(roomSql(sql), values);
      return {
        async first<T>() { return (await execute()).rows[0] as T | undefined; },
        async run() { return { meta: { changes: (await execute()).rowCount ?? 0 } }; },
      };
    } };
  } };
}
