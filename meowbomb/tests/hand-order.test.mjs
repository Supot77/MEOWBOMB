import {test} from 'node:test';import assert from 'node:assert/strict';
import {reconcileOrder,moveCard} from '../lib/hand-order.ts';
test('saved order survives new cards and removes spent cards',()=>{assert.deepEqual(reconcileOrder(['c','a','b'],['a','c','d']),['c','a','d']);});
test('reconciliation rejects stale and duplicate saved IDs',()=>{assert.deepEqual(reconcileOrder(['x','b','b','a'],['a','b','c']),['b','a','c']);});
test('moving a card preserves the original draft for cancellation',()=>{const order=['a','b','c'];assert.deepEqual(moveCard(order,1,-1),['b','a','c']);assert.deepEqual(order,['a','b','c']);assert.deepEqual(moveCard(order,0,-1),order);assert.deepEqual(moveCard(order,2,1),order);});
