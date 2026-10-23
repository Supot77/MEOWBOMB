'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {Card} from '../../lib/game';
export default function FutureViewer({cards,busy,onDone,render,reorder=false}:{cards:Card[];busy:boolean;reorder?:boolean;onDone:(order:number[])=>void;render:(card:Card)=>ReactNode}){
 const [order,setOrder]=useState(()=>cards.map((_,i)=>i));
 function move(i:number,delta:number){setOrder(prev=>{const result=[...prev];[result[i],result[i+delta]]=[result[i+delta],result[i]];return result;});}
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=dialog.current;if(d&&!d.open)d.showModal();return()=>{if(d?.open)d.close();};},[]);
 return <dialog ref={dialog} className="future-dialog" aria-labelledby="future-title" aria-describedby="future-description" onCancel={e=>e.preventDefault()}>
 <h2 id="future-title" tabIndex={-1} autoFocus>{reorder?'เปลี่ยนอนาคต':'อนาคตของคุณ'}</h2>
 <p id="future-description">{reorder?'จัดลำดับได้จนกว่าจะกดยืนยัน · คนอื่นมองไม่เห็นไพ่เหล่านี้':'ดูได้จนกว่าจะกด “ดูเสร็จแล้ว” · คนอื่นมองไม่เห็นไพ่เหล่านี้'}</p>
 <ol className="future-cards">{order.map((index,i)=>{const card=cards[index];return <li key={card.id}><span className="future-order">{i===0?'ใบที่ 1 · บนสุด':`ใบที่ ${i+1}`}</span><div className={'future-card '+card.type}>{render(card)}</div>{reorder&&<div className="future-move"><button disabled={busy||i===0} aria-label={'ย้ายใบที่ '+(i+1)+' ไปก่อน'} onClick={()=>move(i,-1)}>←</button><button disabled={busy||i===order.length-1} aria-label={'ย้ายใบที่ '+(i+1)+' ไปหลัง'} onClick={()=>move(i,1)}>→</button></div>}</li>;})}</ol>
 <p className="fine">{reorder?'ใช้ลูกศรสลับตำแหน่ง ซ้ายสุดคือไพ่ที่จะจั่วก่อน':'ดูจากซ้ายไปขวา · ไพ่ยังอยู่ในลำดับเดิม'}</p>
 <button className="future-done" disabled={busy} onClick={()=>onDone(order)}>{reorder?'ยืนยันลำดับใหม่':'ดูเสร็จแล้ว'}</button>
 </dialog>;
}
