'use client';
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import type {Card} from '../../lib/game';
type Props={cards:Card[];mine:boolean;phase:string;favor:boolean;selected:string[];onSelect:(ids:string[])=>void;onConfirm:(card:Card)=>void;render:(card:Card)=>ReactNode;busy:boolean;arrivals:string[]};
export default function CardHand({cards,mine,phase,favor,selected,onSelect,onConfirm,render,busy,arrivals}:Props){
 const [open,setOpen]=useState(mine||favor),[center,setCenter]=useState(0),[combo,setCombo]=useState(false),[width,setWidth]=useState(320);
 const box=useRef<HTMLDivElement>(null),gesture=useRef({x:0,y:0,center:0,moved:false,active:false});
 useEffect(()=>{setOpen(mine||favor);setCenter(Math.max(0,(cards.length-1)/2));setCombo(false);onSelect([]);},[mine,favor]);
 useEffect(()=>{setCenter(c=>Math.max(0,Math.min(c,cards.length-1)));},[cards.length]);
 useEffect(()=>{if(!box.current)return;const observer=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));observer.observe(box.current);return()=>observer.disconnect();},[]);
 const clamp=(n:number)=>Math.max(0,Math.min(cards.length-1,n));
 const step=Math.min(52,Math.max(22,(width-160)/5));
 function tap(card:Card){if(gesture.current.moved)return;if(!open){setOpen(true);return;}if(combo){onSelect(selected.includes(card.id)?selected.filter(id=>id!==card.id):[...selected,card.id].slice(-3));return;}if(selected.includes(card.id)){onConfirm(card);return;}setCenter(cards.findIndex(c=>c.id===card.id));onSelect([card.id]);}
 return <section className={'hand-dock '+(open?'is-open':'is-closed')} aria-label="ไพ่ในมือ">
 <div className="hand-toolbar"><button className="secondary" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'หุบไพ่':'ดูไพ่ในมือ'} · {cards.length} ใบ</button>{open&&mine&&phase==='turn'&&<button className="quiet" aria-pressed={combo} onClick={()=>{setCombo(!combo);onSelect([]);}}>{combo?'กลับเลือกใบเดียว':'เลือกคอมโบ'}</button>}</div>
 <p className="hand-hint" aria-live="polite">{!open?'แตะเพื่อเปิดดูไพ่ได้ทุกเวลา':combo?'เลือกไพ่ชื่อเดียวกัน 2–3 ใบ · ลากดูใบอื่นได้โดยไม่เสียที่เลือก':!mine&&!favor?'ดูไพ่ได้ · เล่น Nope ได้เมื่อมีช่วงตอบโต้':'ลากซ้าย–ขวาเพื่อดูไพ่ · แตะเพื่อยกขึ้น · แตะซ้ำเพื่อเล่น'}</p>
 <div ref={box} className="hand-stage" onPointerDown={e=>{gesture.current={x:e.clientX,y:e.clientY,center,moved:false,active:true};}} onPointerMove={e=>{const p=gesture.current;if(!p.active||!open)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(!p.moved&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){p.moved=true;e.currentTarget.setPointerCapture(e.pointerId);}if(p.moved){setCenter(clamp(p.center-dx/step));if(!combo)onSelect([]);}}} onPointerUp={()=>{gesture.current.active=false;}} onPointerCancel={()=>{gesture.current.active=false;gesture.current.moved=true;}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setCenter(c=>clamp(Math.round(c)+(e.key==='ArrowRight'?1:-1)));if(!combo)onSelect([]);}}}>
 {cards.map((card,i)=>{const d=i-center,shown=open&&Math.abs(d)<4,raised=selected.includes(card.id);return <button key={card.id} type="button" disabled={busy} tabIndex={shown?0:-1} aria-hidden={!shown} aria-pressed={raised} className={'card fan-card '+card.type+(raised?' selected':'')+(arrivals.includes(card.id)?' arriving':'')} style={{'--fan-x':`${open?d*step:((i%5)-2)*3}px`,'--fan-y':`${open?Math.min(38,d*d*3):35}px`,'--fan-angle':`${open?Math.max(-20,Math.min(20,d*6)):((i%5)-2)*2}deg`,zIndex:raised?60:30-Math.round(Math.abs(d)),visibility:open&&!shown?'hidden':'visible'} as CSSProperties} onClick={e=>{if(e.detail===0)gesture.current.moved=false;tap(card);}}>{render(card)}</button>;})}
 {!open&&<button className="closed-hand-hit" aria-label="เปิดไพ่ในมือ" onClick={()=>setOpen(true)}><span>เปิดดูไพ่</span></button>}
 </div>
 {open&&cards.length>1&&<nav className="hand-navigation" aria-label="ไล่ดูไพ่"><button className="quiet" disabled={center<=0} onClick={()=>{setCenter(c=>clamp(Math.round(c)-1));if(!combo)onSelect([]);}}>← ใบก่อน</button><span>{Math.round(center)+1} / {cards.length}</span><button className="quiet" disabled={center>=cards.length-1} onClick={()=>{setCenter(c=>clamp(Math.round(c)+1));if(!combo)onSelect([]);}}>ใบถัดไป →</button></nav>}
 </section>;
}
