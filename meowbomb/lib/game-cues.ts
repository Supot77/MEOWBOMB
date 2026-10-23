export type CueGame={phase:string;currentPlayerId:string;turnsOwed:number;players:{id:string;name:string;alive:boolean}[]};
export function newExplosions(previous:CueGame|null,current:CueGame){if(!previous)return [];return current.players.filter(p=>!p.alive&&previous.players.some(old=>old.id===p.id&&old.alive));}
export function beginsMyTurn(previous:CueGame|null,current:CueGame,me:string){return current.phase==='turn'&&current.currentPlayerId===me&&(!previous||previous.currentPlayerId!==me||previous.turnsOwed!==current.turnsOwed);}
