export const HOST_OFFLINE_MS=2*60*1000;
export const ONLINE_MS=20000;
export function hostTransferNeeded(room:{host:string;players:{id:string;seen:number}[]},now=Date.now()){
 const host=room.players.find(p=>p.id===room.host);
 return (!host||now-host.seen>=HOST_OFFLINE_MS)&&room.players.some(p=>p.id!==room.host&&now-p.seen<ONLINE_MS);
}
export function transferOfflineHost(room:{host:string;players:{id:string;seen:number}[]},now=Date.now()){
 if(!hostTransferNeeded(room,now))return;
 const next=room.players.find(p=>p.id!==room.host&&now-p.seen<ONLINE_MS);
 if(next)room.host=next.id;
}
export const CREATE_LIMIT=5;
export const CREATE_WINDOW_MS=10*60*1000;
export const CREATE_LIMIT_SQL=`INSERT INTO meowbomb.creation_limits (key,count,reset_at) VALUES (?,1,?)
 ON CONFLICT (key) DO UPDATE SET
 count=CASE WHEN creation_limits.reset_at<=? THEN 1 ELSE creation_limits.count+1 END,
 reset_at=CASE WHEN creation_limits.reset_at<=? THEN excluded.reset_at ELSE creation_limits.reset_at END
 WHERE creation_limits.reset_at<=? OR creation_limits.count<5 RETURNING count,reset_at`;
