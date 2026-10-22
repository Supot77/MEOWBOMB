'use client';
import {useState} from 'react';
import CardHand from './card-hand';
import type {Card} from '../../lib/game';
export default function PairPicker({count,busy,onPick}:{count:number;busy:boolean;onPick:(position:number)=>void}){
 const [selected,setSelected]=useState<string[]>([]);
 const cards:Card[]=Array.from({length:count},(_,i)=>({id:'slot-'+i,type:'bomb'}));
 return <section className="pair-picker"><h3>เลือกไพ่คว่ำหนึ่งใบจากเพื่อน</h3><p>แตะเพื่อยกไพ่ แล้วแตะใบเดิมอีกครั้งเพื่อยืนยัน</p><CardHand cards={cards} mine phase="pair_pick" favor={false} selected={selected} onSelect={setSelected} onConfirm={c=>onPick(cards.findIndex(x=>x.id===c.id))} render={()=> <><span className="card-art pair-back"/><b>ไพ่ของเพื่อน</b><span>ไม่เปิดเผยจนเลือกสำเร็จ</span></>} busy={busy} arrivals={[]}/></section>;
}
