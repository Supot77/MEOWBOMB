import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const local=path.join(root,'.cloudflare.local.json');
const mode=process.argv[2];
function fail(s){console.error(s);process.exit(1);}
if(mode==='configure'){
 const id=process.argv[3];if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id??'')||id==='00000000-0000-4000-8000-000000000000')fail('Pass the real D1 database_id: npm run cf:configure -- <database_id>');
 fs.writeFileSync(local,JSON.stringify({database_id:id},null,2)+'\n');console.log('Saved local Cloudflare database binding. No credentials stored.');process.exit(0);
}
const saved=fs.existsSync(local)?JSON.parse(fs.readFileSync(local,'utf8')):{};
const databaseId=process.env.MEOWBOMB_D1_ID??saved.database_id;
if(!databaseId||databaseId==='00000000-0000-4000-8000-000000000000')fail('Configure a real D1 first: npm run cf:configure -- <database_id>, or set MEOWBOMB_D1_ID.');
const built=path.join(root,'dist/server/wrangler.json');if(!fs.existsSync(built))fail('Run npm run build first.');
const config=JSON.parse(fs.readFileSync(built,'utf8'));
config.name='meowbomb';config.workers_dev=true;
config.d1_databases=[{binding:'DB',database_name:'meowbomb-db',database_id:databaseId,migrations_dir:path.join(root,'drizzle')}];
const output=path.join(root,'dist/server/wrangler.cloudflare.json');fs.writeFileSync(output,JSON.stringify(config,null,2));
function run(args){const r=spawnSync(process.execPath,['--import',path.join(root,'scripts/sites-env.mjs'),path.join(root,'node_modules/wrangler/bin/wrangler.js'),...args],{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
if(mode==='prepare'){console.log('Cloudflare config prepared: dist/server/wrangler.cloudflare.json');}
else if(mode==='migrate')run(['d1','migrations','apply','DB','--remote','--config',output]);
else if(mode==='deploy')run(['deploy','--config',output]);
else if(mode==='check')run(['deploy','--dry-run','--outdir',path.join(root,'outputs/cloudflare-check'),'--config',output]);
else fail('Expected configure, prepare, migrate, deploy or check.');
