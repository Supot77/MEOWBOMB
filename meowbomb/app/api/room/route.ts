import { env } from 'cloudflare:workers';
import { digest, snapshot, mutate, type Room, type Seat } from '../../../lib/rooms';
export async function POST(req:Request){
 try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origin ไม่ถูกต้อง'},{status:403});
 const raw=await req.text();if(raw.length>10000)throw Error('คำสั่งยาวเกินไป');const b=JSON.parse(raw);const db=env.DB;if(!db)throw Error('ฐานข้อมูลยังไม่พร้อม');const now=Date.now();
 if(b.op==='create'||b.op==='join'){
 const name=String(b.name??'').trim().slice(0,24);if(!name)throw Error('กรอกชื่อเล่น');const token=crypto.randomUUID()+crypto.randomUUID();const seat:Seat={id:crypto.randomUUID(),name,avatar:String(b.avatar??'🐈').slice(0,8),hash:await digest(token),ready:false,seen:now};
 if(b.op==='create'){
 await db.prepare('DELETE FROM rooms WHERE code IN (SELECT code FROM rooms WHERE updated < ? LIMIT 20)').bind(now-86400000).run();
 for(let n=0;n<4;n++){const code=crypto.randomUUID().replaceAll('-','').slice(0,6).toUpperCase();const r:Room={code,revision:0,host:seat.id,players:[seat],game:null,requests:[],votes:[],updated:now};const result=await db.prepare('INSERT OR IGNORE INTO rooms(code,revision,data,updated) VALUES(?,?,?,?)').bind(code,0,JSON.stringify(r),now).run();if(result.meta.changes)return Response.json({...snapshot(r,seat.id),token});}throw Error('สร้างห้องไม่สำเร็จ ลองใหม่');
 }
 const row=await db.prepare('SELECT data FROM rooms WHERE code=? AND updated>?').bind(String(b.code).toUpperCase(),now-86400000).first<{data:string}>();if(!row)throw Error('ไม่พบห้องหรือห้องหมดอายุ');const r:Room=JSON.parse(row.data);if(r.game||r.players.length>=5)throw Error('ห้องเต็มหรือเริ่มเกมแล้ว');const old=r.revision;r.players.push(seat);r.revision++;r.updated=now;const result=await db.prepare('UPDATE rooms SET data=?,revision=?,updated=? WHERE code=? AND revision=?').bind(JSON.stringify(r),r.revision,now,r.code,old).run();if(!result.meta.changes)throw Error('มีคนเข้าห้องพร้อมกัน กรุณาลองใหม่');return Response.json({...snapshot(r,seat.id),token});
 }
 const code=String(b.code??'').toUpperCase();const row=await db.prepare('SELECT data FROM rooms WHERE code=? AND updated>?').bind(code,now-86400000).first<{data:string}>();if(!row)throw Error('ไม่พบห้องหรือห้องหมดอายุ');const r:Room=JSON.parse(row.data);const hash=await digest(String(b.token??''));const me=r.players.find(p=>p.hash===hash);if(!me)return Response.json({error:'สิทธิ์เข้าห้องไม่ถูกต้อง'},{status:401});
 if(b.op!=='state'&&(typeof b.requestId!=='string'||b.requestId.length>80))throw Error('ไม่มีหมายเลขคำสั่ง');
 if(r.requests.includes(b.requestId))return Response.json(snapshot(r,me.id));
 if(b.op!=='state'&&b.revision!==r.revision)return Response.json({...snapshot(r,me.id),error:'สถานะเปลี่ยนแล้ว ลองเลือกอีกครั้ง'},{status:409});
 const old=r.revision;mutate(r,me.id,b,now);if(b.op!=='state'){r.requests=[...r.requests,b.requestId].slice(-100);}r.revision++;
 const result=await db.prepare('UPDATE rooms SET data=?,revision=?,updated=? WHERE code=? AND revision=?').bind(JSON.stringify(r),r.revision,now,code,old).run();if(!result.meta.changes)return Response.json({error:'สถานะเปลี่ยนแล้ว กรุณาลองใหม่'},{status:409});return Response.json(snapshot(r,me.id));
 }catch(e){return Response.json({error:e instanceof Error?e.message:'คำสั่งไม่สำเร็จ'},{status:400});}
}
