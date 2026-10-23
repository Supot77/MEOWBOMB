'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {newExplosions,beginsMyTurn,type CueGame} from '../../lib/game-cues';
export default function GameCues({game,me}:{game:CueGame;me:string}){
 const previous=useRef<CueGame|null>(null);
 const [turn,setTurn]=useState(false),[turnTick,setTurnTick]=useState(0),[explosion,setExplosion]=useState<{names:string;mine:boolean}|null>(null);
 useEffect(()=>{const old=previous.current;const dead=newExplosions(old,game);if(dead.length)setExplosion({names:dead.map(p=>p.name).join(', '),mine:dead.some(p=>p.id===me)});if(beginsMyTurn(old,game,me)){setTurn(true);setTurnTick(t=>t+1);}if(game.currentPlayerId!==me||game.phase==='finished')setTurn(false);previous.current=game;},[game,me]);
 useEffect(()=>{if(!turn)return;const timer=setTimeout(()=>setTurn(false),6000);return()=>clearTimeout(timer);},[turn,turnTick]);
 useEffect(()=>{if(!explosion)return;const timer=setTimeout(()=>setExplosion(null),5200);return()=>clearTimeout(timer);},[explosion]);
 const mine=game.currentPlayerId===me&&game.phase!=='finished';
 return <>
 <div className={'turn-strip '+(mine?'my-turn':'')} role="status" aria-live="polite"><span aria-hidden="true">{game.phase==='finished'?'★':mine?'➜':'◷'}</span><div><b>{game.phase==='finished'?'จบรอบแล้ว':mine?'ถึงตาคุณแล้ว!':'ตาของ '+game.players.find(p=>p.id===game.currentPlayerId)?.name}</b>{game.phase!=='finished'&&<small>{mine?'คุณ':'ผู้เล่นคนนี้'}เหลือ {game.turnsOwed} เทิร์น{game.phase!=='turn'?' · กำลังทำแอคชั่น':''}</small>}</div></div>
 {turn&&!explosion&&<aside className="turn-pop" aria-label="แจ้งเตือนถึงตาคุณ"><button className="quiet cue-close" aria-label="ปิดแจ้งเตือนถึงตา" onClick={()=>setTurn(false)}>×</button><span className="turn-paw" aria-hidden="true">🐾</span><h2>ถึงตาคุณแล้ว!</h2><p>เหลือ {game.turnsOwed} เทิร์น · เลือกไพ่หรือจั่วเพื่อเล่นต่อ</p><a href="#my-hand" onClick={()=>setTurn(false)}>ไปที่ไพ่ของฉัน ↓</a></aside>}
 {explosion&&<div className="explosion-scene"><div className="explosion-cloud" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--ray':`${i*30}deg`,'--delay':`${i*12}ms`} as CSSProperties}/>)}<span>✹</span></div><section className="explosion-message" role="alert"><button className="quiet cue-close" aria-label="ปิดผลระเบิด" onClick={()=>setExplosion(null)}>×</button><b className="boom-word">BOOM!</b><h2>{explosion.mine?'คุณโดนเหมียวระเบิด!':explosion.names+' ระเบิดแล้ว!'}</h2><p>ไม่มี Defuse · ออกจากรอบนี้</p><button onClick={()=>setExplosion(null)}>{explosion.mine?'ดูเพื่อนเล่นต่อ':'รับทราบ'}</button></section></div>}
 </>;
}
