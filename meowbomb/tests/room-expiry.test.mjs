import {test} from 'node:test';import assert from 'node:assert/strict';
import {ROOM_IDLE_MS,roomCutoff,roomExpired} from '../lib/room-expiry.ts';
test('room closes at exactly one hour, never before',()=>{const now=10_000_000;assert.equal(ROOM_IDLE_MS,3600000);assert.equal(roomExpired(now-ROOM_IDLE_MS+1,now),false);assert.equal(roomExpired(now-ROOM_IDLE_MS,now),true);assert.equal(roomExpired(now-ROOM_IDLE_MS-1,now),true);assert.equal(roomCutoff(now),now-3600000);});
test('recent heartbeat keeps room alive while old presence expires',()=>{const now=10_000_000;assert.equal(roomExpired(now-10000,now),false);assert.equal(roomExpired(now-3600001,now),true);});
