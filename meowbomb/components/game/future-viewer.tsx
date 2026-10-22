'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import type {Card} from '../../lib/game';
export default function FutureViewer({cards,busy,onDone,render}:{cards:Card[];busy:boolean;onDone:()=>void;render:(card:Card)=>ReactNode}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const d=dialog.current;if(d&&!d.open)d.showModal();return()=>{if(d?.open)d.close();};},[]);
 return <dialog ref={dialog} className="future-dialog" aria-labelledby="future-title" aria-describedby="future-description" onCancel={e=>e.preventDefault()}>
 <h2 id="future-title" tabIndex={-1} autoFocus>อนาคตของคุณ</h2>
 <p id="future-description">ดูได้จนกว่าจะกด “ดูเสร็จแล้ว” · คนอื่นมองไม่เห็นไพ่เหล่านี้</p>
 <ol className="future-cards">{cards.map((card,i)=><li key={card.id}><span className="future-order">{i===0?'ใบที่ 1 · บนสุด':`ใบที่ ${i+1}`}</span><div className={'future-card '+card.type}>{render(card)}</div></li>)}</ol>
 <p className="fine">ดูจากซ้ายไปขวา · ไพ่ยังอยู่ในลำดับเดิม</p>
 <button className="future-done" disabled={busy} onClick={onDone}>ดูเสร็จแล้ว</button>
 </dialog>;
}
