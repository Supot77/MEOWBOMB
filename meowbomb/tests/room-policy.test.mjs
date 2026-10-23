import {test} from 'node:test';import assert from 'node:assert/strict';
import {hostTransferNeeded,transferOfflineHost,HOST_OFFLINE_MS} from '../lib/room-policy.ts';
test('host is transferred at two minutes only when another seat is online',()=>{const now=1000000;const r={host:'a',players:[{id:'a',seen:now-HOST_OFFLINE_MS+1},{id:'b',seen:now}]};assert.equal(hostTransferNeeded(r,now),false);r.players[0].seen--;assert.equal(hostTransferNeeded(r,now),true);transferOfflineHost(r,now);assert.equal(r.host,'b');r.players[0].seen=now;transferOfflineHost(r,now);assert.equal(r.host,'b');});
test('no online replacement means host remains unchanged',()=>{const r={host:'a',players:[{id:'a',seen:0},{id:'b',seen:0}]};transferOfflineHost(r,1000000);assert.equal(r.host,'a');});
