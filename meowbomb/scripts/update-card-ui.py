from pathlib import Path
p=Path('app/page.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace("useEffect,useRef,useState", "useEffect,useRef,useState,type CSSProperties")
pos=s.index('type State=')
s=s[:pos]+'''function Art({type,className=''}:{type:string;className?:string}){const index=type==='back'?13:type==='winner'?14:Math.max(0,CARD_TYPES.indexOf(type as CardType));return <span className={'card-art '+className} aria-hidden="true" style={{backgroundPosition:`${(index%4)*100/3}% ${Math.floor(index/4)*100/3}%`}}/>;}
'''+s[pos:]
s=s.replace("[now,setNow]=useState(Date.now());", "[now,setNow]=useState(Date.now()),[arrivals,setArrivals]=useState<string[]>([]),[motion,setMotion]=useState<'draw'|'play'|null>(null);")
s=s.replace("if(data.code){setS(data);", "if(data.code){const old=current.s?.game;if(old&&data.game){const added=data.game.hand.filter((c:Card)=>!old.hand.some((o:Card)=>o.id===c.id));if(added.length){setArrivals(added.map((c:Card)=>c.id));setMotion('draw');}else if(data.game.discard.length>old.discard.length)setMotion('play');}setS(data);")
s=s.replace(" const action=(input:any)", " useEffect(()=>{if(!motion)return;const t=setTimeout(()=>{setMotion(null);setArrivals([]);},900);return()=>clearTimeout(t);},[motion,s?.game?.discard.length]);\n const action=(input:any)")
s=s.replace('<section className="game">','<section className={"game motion-"+(motion??"idle")}>')
s=s.replace('<Cat/><b>จั่วไพ่</b>','<Art type="back"/><b>จั่วไพ่</b>')
s=s.replace('<strong>{icons[g.discard.at(-1)?.type]??\'—\'}</strong>', '<Art key={g.discard.at(-1)?.id??\'empty\'} type={g.discard.at(-1)?.type??\'back\'} className="discard-art"/>')
s=s.replace('<div className="hand">{g.hand.map((c:Card)=><button', '<div className="hand-scroll"><div className="hand" style={{\'--count\':g.hand.length} as CSSProperties}>{g.hand.map((c:Card,i:number)=><button')
s=s.replace("className={'card '+c.type+' '+(selected.includes(c.id)?'selected':'')}", "style={{'--angle':`${Math.max(-18,Math.min(18,(i-(g.hand.length-1)/2)*4))}deg`,'--lift':`${Math.min(28,Math.abs(i-(g.hand.length-1)/2)*5)}px`,'--order':i} as CSSProperties} className={'card '+c.type+' '+(selected.includes(c.id)?'selected ':'')+(arrivals.includes(c.id)?'arriving':'')}")
s=s.replace('<strong>{icons[c.type]}</strong>', '<Art type={c.type}/>').replace('</span></button>)}</div>', '</span></button>)}</div></div>')
p.write_text(s,encoding='utf-8')
