export const CARD_TYPES = ['bomb','defuse','attack','skip','favor','shuffle','future','nope','cat1','cat2','cat3','cat4','cat5','alter_future','targeted_attack'] as const;
export type CardType = typeof CARD_TYPES[number];
export type Card = {id:string;type:CardType};
export type Player = {id:string;name:string;avatar:string;alive:boolean};
export type Input = {type:string;cardIds?:string[];cardId?:string;targetId?:string;requestedType?:CardType;position?:number;order?:number[]};
export type Pending = {actorId:string;type:string;targetId?:string;requestedType?:CardType;deadline:number;nopes:number;passes:string[];attackTurns?:number};
export type Game = {players:Player[];hands:Record<string,Card[]>;deck:Card[];discard:Card[];removed:Card[];currentPlayerId:string;turnsOwed:number;attacked:boolean;phase:'turn'|'response'|'favor'|'future'|'insert'|'finished'|'pair_shuffle'|'pair_pick'|'alter_future';pending:Pending|null;future:Card[];bomb:Card|null;winnerId:string|null;log:string[]};
const counts = [4,6,4,4,4,4,5,5,4,4,4,4,4,3,3];
function random(n:number){if(n<1)throw Error('ไม่มีตัวเลือก');const a=new Uint32Array(1);const limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%n;}
function shuffle<T>(a:T[]){for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function log(g:Game,s:string){g.log=[...g.log,s].slice(-40);}
function alive(g:Game,id:string){return g.players.some(p=>p.id===id&&p.alive);}
function next(g:Game){const i=g.players.findIndex(p=>p.id===g.currentPlayerId);for(let n=1;n<=g.players.length;n++){const p=g.players[(i+n)%g.players.length];if(p.alive){g.currentPlayerId=p.id;return;}}}
function endTurn(g:Game){g.turnsOwed--;g.phase='turn';if(g.turnsOwed<=0){next(g);g.turnsOwed=1;g.attacked=false;}}
function take(g:Game,id:string,cardId:string|undefined){const i=g.hands[id].findIndex(c=>c.id===cardId);if(i<0)throw Error('ไม่มีไพ่ใบนี้');return g.hands[id].splice(i,1)[0];}
export function createGame(players:{id:string;name:string;avatar:string}[],_now=Date.now()):Game{
 if(players.length<2||players.length>5||new Set(players.map(p=>p.id)).size!==players.length)throw Error('ต้องมีผู้เล่น 2–5 คน');
 const cards=CARD_TYPES.flatMap((type,i)=>Array.from({length:counts[i]},(_,j)=>({id:`${type}-${j}`,type})));const bombs=cards.filter(c=>c.type==='bomb');const defuses=cards.filter(c=>c.type==='defuse');const deck=cards.filter(c=>c.type!=='bomb'&&c.type!=='defuse');const hands:Record<string,Card[]>={};
 for(const p of players)hands[p.id]=[defuses.shift()!];deck.push(...defuses.splice(0,2));shuffle(deck);for(const p of players)hands[p.id].push(...deck.splice(0,7));deck.push(...bombs.splice(0,players.length-1));shuffle(deck);
 return {players:players.map(p=>({...p,alive:true})),hands,deck,discard:[],removed:[...bombs,...defuses],currentPlayerId:players[random(players.length)].id,turnsOwed:1,attacked:false,phase:'turn',pending:null,future:[],bomb:null,winnerId:null,log:['เริ่มเกมแล้ว']};
}
function resolve(g:Game){const p=g.pending!;g.phase='turn';g.pending=null;if(p.nopes%2){log(g,'แอคชั่นถูก Nope ยกเลิก');return;}log(g,`แอคชั่น ${p.type} สำเร็จ`);
 if(p.type==='skip')endTurn(g);
 if(p.type==='attack'){const debt=g.attacked?g.turnsOwed:0;next(g);g.turnsOwed=debt+2;g.attacked=true;}
 if(p.type==='targeted_attack'){const debt=g.attacked?g.turnsOwed:0;g.currentPlayerId=p.targetId!;g.turnsOwed=debt+(p.attackTurns??2);g.attacked=true;}
 if(p.type==='alter_future'){g.future=g.deck.slice(0,3);g.phase='alter_future';}
 if(p.type==='shuffle')shuffle(g.deck);
 if(p.type==='future'){g.future=g.deck.slice(0,3);g.phase='future';}
 if(p.type==='favor'&&g.hands[p.targetId!].length){g.pending=p;g.phase='favor';}
 if(p.type==='pair'){if(g.hands[p.targetId!].length){shuffle(g.hands[p.targetId!]);g.pending=p;g.phase='pair_shuffle';}else log(g,'เป้าหมายไม่มีไพ่ คอมโบจบลง');}
 if(p.type==='triple'){const h=g.hands[p.targetId!];const i=h.findIndex(c=>c.type===p.requestedType);if(i>=0){g.hands[p.actorId].push(h.splice(i,1)[0]);log(g,'ขอไพ่สำเร็จ');}else log(g,'เป้าหมายไม่มีไพ่ที่ขอ เสียคอมโบ');}
}
export function settle(game:Game,now=Date.now()):Game{const g=structuredClone(game);if(g.phase==='response'&&g.pending&&g.pending.deadline<=now)resolve(g);return g;}
export function command(game:Game,id:string,input:Input,now=Date.now()):Game{
 const g=settle(game,now);if(!alive(g,id)||g.phase==='finished')throw Error('ไม่สามารถเล่นได้');
 if(g.phase==='response'){
  const p=g.pending!;if(input.type==='pass'){if(!p.passes.includes(id))p.passes.push(id);if(p.passes.length===g.players.filter(p=>p.alive).length)resolve(g);return g;}
  if(input.type==='nope'){const c=take(g,id,input.cardId);if(c.type!=='nope')throw Error('ต้องใช้ Nope');g.discard.push(c);p.nopes++;p.deadline=now+8000;p.passes=[];log(g,'มีผู้เล่นใช้ Nope');return g;}throw Error('รอช่วงตอบโต้ Nope');
 }
 if(g.phase==='pair_shuffle'){const p=g.pending!;if(id!==p.targetId)throw Error('รอเป้าหมายจัดไพ่');if(input.type==='pair_shuffle'){shuffle(g.hands[id]);return g;}if(input.type==='pair_ready'){g.phase='pair_pick';return g;}throw Error('เลือกสับไพ่หรือพร้อมให้เลือก');}
 if(g.phase==='pair_pick'){const p=g.pending!;if(id!==p.actorId||input.type!=='pair_pick')throw Error('รอคนลง Pair เลือกไพ่');const h=g.hands[p.targetId!];if(!Number.isInteger(input.position)||input.position!<0||input.position!>=h.length)throw Error('เลือกตำแหน่งไพ่ที่ถูกต้อง');g.hands[id].push(h.splice(input.position!,1)[0]);g.pending=null;g.phase='turn';log(g,'เลือกไพ่คว่ำสำเร็จ');return g;}
 if(g.phase==='favor'){if(id!==g.pending!.targetId||input.type!=='give')throw Error('รอผู้เล่นให้ไพ่');g.hands[g.pending!.actorId].push(take(g,id,input.cardId));g.pending=null;g.phase='turn';return g;}
 if(id!==g.currentPlayerId)throw Error('ยังไม่ถึงตาคุณ');
 if(g.phase==='alter_future'){const order=input.order;if(input.type!=='confirm_future_order'||!Array.isArray(order)||order.length!==g.future.length||new Set(order).size!==order.length||order.some(i=>!Number.isInteger(i)||i<0||i>=g.future.length))throw Error('ยืนยันลำดับไพ่ให้ครบและไม่ซ้ำ');g.deck.splice(0,g.future.length,...order.map(i=>g.future[i]));g.future=[];g.phase='turn';return g;}
 if(g.phase==='future'){if(input.type!=='close_future')throw Error('ปิดผลดูก่อน');g.future=[];g.phase='turn';return g;}
 if(g.phase==='insert'){if(input.type!=='insert'||!Number.isInteger(input.position)||input.position!<0||input.position!>g.deck.length)throw Error('ตำแหน่งไม่ถูกต้อง');g.deck.splice(input.position!,0,g.bomb!);g.bomb=null;endTurn(g);return g;}
 if(input.type==='draw'){
  const c=g.deck.shift();if(!c)throw Error('กองจั่วว่าง');if(c.type!=='bomb'){g.hands[id].push(c);endTurn(g);return g;}
  log(g,`${g.players.find(p=>p.id===id)!.name} จั่วระเบิด`);const d=g.hands[id].find(c=>c.type==='defuse');if(d){g.discard.push(take(g,id,d.id));g.bomb=c;g.phase='insert';return g;}
  g.discard.push(c);g.removed.push(...g.hands[id]);g.hands[id]=[];g.players.find(p=>p.id===id)!.alive=false;const survivors=g.players.filter(p=>p.alive);if(survivors.length===1){g.phase='finished';g.winnerId=survivors[0].id;}else{next(g);g.turnsOwed=1;g.attacked=false;}return g;
 }
 if(input.type!=='play')throw Error('คำสั่งไม่ถูกต้อง');const ids=input.cardIds;if(!Array.isArray(ids)||ids.length<1||ids.length>3||new Set(ids).size!==ids.length)throw Error('เลือกไพ่ 1–3 ใบ');const selected=ids.map(cid=>take(g,id,cid));const targetedCombo=selected.length===2&&selected.some(c=>c.type==='attack')&&selected.some(c=>c.type==='targeted_attack');if(!targetedCombo&&selected.some(c=>c.type!==selected[0].type))throw Error('คอมโบต้องชื่อเดียวกัน');const type=targetedCombo?'targeted_attack':selected.length===2?'pair':selected.length===3?'triple':selected[0].type;
 if(!['pair','triple','attack','skip','favor','shuffle','future','alter_future','targeted_attack'].includes(type))throw Error('ไพ่ใบนี้ใช้เดี่ยวไม่ได้');if(['pair','triple','favor','targeted_attack'].includes(type)&&(!input.targetId||input.targetId===id||!alive(g,input.targetId)))throw Error('เลือกผู้เล่นเป้าหมาย');if(type==='triple'&&!CARD_TYPES.includes(input.requestedType!))throw Error('เลือกชนิดไพ่ที่ขอ');
 g.discard.push(...selected);g.pending={actorId:id,type,targetId:input.targetId,requestedType:input.requestedType,deadline:now+8000,nopes:0,passes:[],attackTurns:targetedCombo?4:2};g.phase='response';log(g,`${g.players.find(p=>p.id===id)!.name} เล่น ${type}`);return g;
}
export function view(g:Game,id:string){return {phase:g.phase,currentPlayerId:g.currentPlayerId,turnsOwed:g.turnsOwed,players:g.players.map(p=>({...p,handCount:g.hands[p.id].length})),hand:g.hands[id]??[],deckCount:g.deck.length,discard:g.discard,pending:g.pending,winnerId:g.winnerId,log:g.log,privatePrompt:g.phase==='pair_shuffle'&&g.pending?.targetId===id?{type:'pair_shuffle'}:g.phase==='pair_pick'&&g.pending?.actorId===id?{type:'pair_pick',count:g.hands[g.pending.targetId!].length}:g.currentPlayerId===id&&(g.phase==='future'||g.phase==='alter_future')?{type:g.phase,cards:g.future}:g.currentPlayerId===id&&g.phase==='insert'?{type:'insert',maxPosition:g.deck.length}:g.phase==='favor'&&g.pending?.targetId===id?{type:'favor',actorId:g.pending.actorId}:null};}
