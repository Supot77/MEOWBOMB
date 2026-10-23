import { createHash } from 'node:crypto';
import { hostTransferNeeded, CREATE_LIMIT_SQL, CREATE_WINDOW_MS } from '../../../lib/room-policy';
import { roomCutoff, ROOM_EXPIRED_MESSAGE } from '../../../lib/room-expiry';
import { cleanupExpiredRooms } from '../../../lib/cleanup-rooms';
import { getRoomDatabase } from '../../../lib/postgres';
export const runtime='nodejs';
export const dynamic='force-dynamic';
import { digest, snapshot, mutate, type Room, type Seat } from '../../../lib/rooms';
export async function POST(req:Request){
 try{
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origin ไม่ถูกต้อง'},{status:403});
 const raw=await req.text();if(raw.length>10000)throw Error('คำสั่งยาวเกินไป');const b=JSON.parse(raw);const db=getRoomDatabase();const now=Date.now();
 if(b.op==='create'||b.op==='join'){
 const name=String(b.name??'').trim().slice(0,24);if(!name)throw Error('กรอกชื่อเล่น');const token=crypto.randomUUID()+crypto.randomUUID();const seat:Seat={id:crypto.randomUUID(),name,avatar:String(b.avatar??'🐈').slice(0,8),hash:await digest(token),ready:false,seen:now};
 if(b.op==='create'){
 const ip=(req.headers.get('x-forwarded-for')??'local').split(',')[0].trim();
 const key=createHash('sha256').update('meowbomb-create:'+ip).digest('hex');
 const allowed=await db.prepare(CREATE_LIMIT_SQL).bind(key,now+CREATE_WINDOW_MS,now,now,now).first<{count:number}>();
 if(!allowed)return Response.json({error:'สร้างห้องบ่อยเกินไป รอสักครู่แล้วลองใหม่ (5 ห้องต่อ 10 นาที)',errorCode:'RATE_LIMITED'},{status:429,headers:{'Retry-After':'600'}});
 await cleanupExpiredRooms(now);
 for(let n=0;n<4;n++){const code=crypto.randomUUID().replaceAll('-','').slice(0,6).toUpperCase();const r:Room={code,revision:0,host:seat.id,players:[seat],game:null,requests:[],votes:[],updated:now};const result=await db.prepare('INSERT OR IGNORE INTO rooms(code,revision,data,updated) VALUES(?,?,?,?)').bind(code,0,JSON.stringify(r),now).run();if(result.meta.changes)return Response.json({...snapshot(r,seat.id),token});}throw Error('สร้างห้องไม่สำเร็จ ลองใหม่');
 }
 const row=await db.prepare('SELECT data FROM rooms WHERE code=? AND updated>?').bind(String(b.code).toUpperCase(),roomCutoff(now)).first<{data:string}>();if(!row){await db.prepare('DELETE FROM rooms WHERE code=? AND updated<=?').bind(String(b.code??'').toUpperCase(),roomCutoff(now)).run();return Response.json({error:ROOM_EXPIRED_MESSAGE,errorCode:'ROOM_EXPIRED'},{status:410});}const r:Room=JSON.parse(row.data);if(r.game||r.players.length>=5)throw Error('ห้องเต็มหรือเริ่มเกมแล้ว');const old=r.revision;r.players.push(seat);r.revision++;r.updated=now;const result=await db.prepare('UPDATE rooms SET data=?,revision=?,updated=? WHERE code=? AND revision=?').bind(JSON.stringify(r),r.revision,now,r.code,old).run();if(!result.meta.changes)throw Error('มีคนเข้าห้องพร้อมกัน กรุณาลองใหม่');return Response.json({...snapshot(r,seat.id),token});
 }
 const code=String(b.code??'').toUpperCase();const row=await db.prepare('SELECT data FROM rooms WHERE code=? AND updated>?').bind(code,roomCutoff(now)).first<{data:string}>();if(!row){await db.prepare('DELETE FROM rooms WHERE code=? AND updated<=?').bind(String(b.code??'').toUpperCase(),roomCutoff(now)).run();return Response.json({error:ROOM_EXPIRED_MESSAGE,errorCode:'ROOM_EXPIRED'},{status:410});}const r:Room=JSON.parse(row.data);const hash=await digest(String(b.token??''));const me=r.players.find(p=>p.hash===hash);if(!me)return Response.json({error:'ที่นั่งนี้ไม่อยู่ในห้องแล้ว กรุณาเข้าห้องใหม่',errorCode:'SESSION_INVALID'},{status:401});
 if(b.op!=='state'&&(typeof b.requestId!=='string'||b.requestId.length>80))throw Error('ไม่มีหมายเลขคำสั่ง');
 if(r.requests.includes(b.requestId))return Response.json(snapshot(r,me.id));
 if(b.op!=='state'&&b.revision!==r.revision)return Response.json({...snapshot(r,me.id),error:'สถานะเปลี่ยนแล้ว ลองเลือกอีกครั้ง'},{status:409});
 // Polls are read-only between presence heartbeats unless a response deadline needs settling.
 if(b.op==='state'&&!hostTransferNeeded(r,now)&&now-me.seen<10000&&!(r.game?.phase==='response'&&r.game.pending&&r.game.pending.deadline<=now))return Response.json(snapshot(r,me.id),{headers:{'Cache-Control':'no-store'}});
 const old=r.revision;mutate(r,me.id,b,now);if(b.op!=='state'){r.requests=[...r.requests,b.requestId].slice(-100);}r.revision++;
 if(b.op==='close'){const deleted=await db.prepare('DELETE FROM rooms WHERE code=? AND revision=?').bind(code,old).run();if(!deleted.meta.changes)return Response.json({error:'สถานะเปลี่ยนแล้ว ลองปิดอีกครั้ง'},{status:409});return Response.json({error:'เจ้าของห้องปิดห้องแล้ว',errorCode:'ROOM_CLOSED'},{status:410});}
 const result=await db.prepare('UPDATE rooms SET data=?,revision=?,updated=? WHERE code=? AND revision=?').bind(JSON.stringify(r),r.revision,now,code,old).run();if(!result.meta.changes)return Response.json({error:'สถานะเปลี่ยนแล้ว กรุณาลองใหม่'},{status:409});return Response.json(snapshot(r,me.id));
 }catch(e){return Response.json({error:e instanceof Error?e.message:'คำสั่งไม่สำเร็จ'},{status:400});}
}
