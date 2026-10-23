import {test} from 'node:test';import assert from 'node:assert/strict';
import {newExplosions,beginsMyTurn} from '../lib/game-cues.ts';
function state(){return {phase:'turn',currentPlayerId:'a',turnsOwed:1,players:[{id:'a',name:'A',alive:true},{id:'b',name:'B',alive:true}]};}
test('turn notice on arrival and successive owed turns but not ordinary polling',()=>{const g=state();assert.equal(beginsMyTurn(null,g,'a'),true);assert.equal(beginsMyTurn(g,structuredClone(g),'a'),false);const old={...g,currentPlayerId:'b'};assert.equal(beginsMyTurn(old,g,'a'),true);assert.equal(beginsMyTurn({...g,turnsOwed:2},g,'a'),true);});
test('future results and finished games do not trigger turn notices',()=>{const g=state();assert.equal(beginsMyTurn(null,{...g,phase:'future'},'a'),false);assert.equal(beginsMyTurn(null,{...g,phase:'finished'},'a'),false);});
test('bomb plus Defuse never triggers elimination animation',()=>{const old=state();assert.deepEqual(newExplosions(old,{...old,phase:'insert'}),[]);});
test('new elimination triggers once, including final winning state',()=>{const old=state(),g=structuredClone(old);g.phase='finished';g.players[0].alive=false;assert.deepEqual(newExplosions(old,g).map(p=>p.id),['a']);assert.deepEqual(newExplosions(g,structuredClone(g)),[]);});
test('refreshing a game with prior eliminated players does not replay the explosion',()=>{const g=state();g.players[0].alive=false;assert.deepEqual(newExplosions(null,g),[]);});
