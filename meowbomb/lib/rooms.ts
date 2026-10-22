import { ROOM_IDLE_MS, roomExpired, ROOM_EXPIRED_MESSAGE } from './room-expiry';
import { createGame, command, settle, view, type Game, type Input } from './game';
export type Seat={id:string;name:string;avatar:string;hash:string;ready:boolean;seen:number};
export type Room={code:string;revision:number;host:string;players:Seat[];game:Game|null;requests:string[];votes:string[];updated:number};
export async function digest(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');}
export function snapshot(r:Room,id:string){return {code:r.code,expiresAt:r.updated+ROOM_IDLE_MS,revision:r.revision,host:r.host,playerId:id,players:r.players.map(({hash,...p})=>({...p,connected:Date.now()-p.seen<20000})),game:r.game?view(r.game,id):null,votes:r.votes};}
export function mutate(r:Room,id:string,body:{op:string;input?:Input;ready?:boolean},now=Date.now()){
 if(roomExpired(r.updated,now))throw Error(ROOM_EXPIRED_MESSAGE);
 const me=r.players.find(p=>p.id===id);if(!me)throw Error('ไม่พบที่นั่ง');me.seen=now;r.updated=now;
 if(r.game)r.game=settle(r.game,now);
 switch(body.op){
 case 'ready': if(r.game)throw Error('เกมเริ่มแล้ว');me.ready=!!body.ready;break;
 case 'start':if(id!==r.host||r.game||r.players.length<2||!r.players.every(p=>p.ready))throw Error('ต้องมีผู้เล่นพร้อม 2–5 คน และเจ้าของห้องเป็นผู้เริ่ม');r.game=createGame(r.players);break;
 case 'action':if(!r.game||!body.input)throw Error('ไม่มีเกม');r.game=command(r.game,id,body.input,now);break;
 case 'replay':if(id!==r.host||r.game?.phase!=='finished')throw Error('ยังเริ่มใหม่ไม่ได้');r.game=null;r.players.forEach(p=>p.ready=false);r.votes=[];break;
 case 'abandon':if(!r.game)throw Error('ไม่มีเกม');if(!r.votes.includes(id))r.votes.push(id);if(r.votes.length>=2&&r.players.filter(p=>now-p.seen<20000).every(p=>r.votes.includes(p.id))){r.game=null;r.votes=[];r.players.forEach(p=>p.ready=false);}break;
 case 'leave':if(r.game)throw Error('เกมยังดำเนินอยู่ กรุณาโหวตยุติรอบ');r.players=r.players.filter(p=>p.id!==id);if(r.host===id)r.host=r.players[0]?.id??'';break;
 case 'state':break;
 default:throw Error('คำสั่งไม่ถูกต้อง');
 }
 return r;
}
