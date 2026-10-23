import pg from 'pg';
import { readFile, readdir } from 'node:fs/promises';
const url=process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if(!url){console.error('Set DATABASE_URL_UNPOOLED (preferred) or DATABASE_URL before running db:migrate.');process.exit(1);}
const client=new pg.Client({connectionString:url,connectionTimeoutMillis:15000});
try {
  await client.connect();
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('meowbomb-schema-migrations'))");
  await client.query('CREATE SCHEMA IF NOT EXISTS meowbomb');
  await client.query('CREATE TABLE IF NOT EXISTS meowbomb.schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  const files=(await readdir(new URL('../db/postgres/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort();
  for(const file of files){
    const version=file.slice(0,-4);
    const applied=await client.query('SELECT version FROM meowbomb.schema_migrations WHERE version=$1',[version]);
    if(!applied.rowCount){
      await client.query(await readFile(new URL('../db/postgres/'+file,import.meta.url),'utf8'));
      await client.query('INSERT INTO meowbomb.schema_migrations(version) VALUES($1)',[version]);
    }
  }
  await client.query('COMMIT');
  console.log('MEOWBOMB schema is current. Other schemas were not changed.');
} catch(error) {
  await client.query('ROLLBACK').catch(()=>{});
  console.error('Migration failed; transaction rolled back. Check database access and schema permissions.');
  process.exitCode=1;
} finally { await client.end().catch(()=>{}); }
