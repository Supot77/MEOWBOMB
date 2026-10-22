import pg from 'pg';
import {roomCutoff} from '../lib/room-expiry.ts';
const c=new pg.Client({connectionString:process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL,connectionTimeoutMillis:15000});
try{await c.connect();const cutoff=roomCutoff();const r=await c.query('DELETE FROM meowbomb.rooms WHERE updated <= $1',[cutoff]);const left=await c.query('SELECT count(*)::int AS remaining FROM meowbomb.rooms');console.log(JSON.stringify({deleted:r.rowCount,...left.rows[0]}));}catch{console.error('Expired-room cleanup failed; no other schema was targeted.');process.exitCode=1;}finally{await c.end().catch(()=>{});}
