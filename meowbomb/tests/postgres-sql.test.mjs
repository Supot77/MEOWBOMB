import {test} from 'node:test';
import assert from 'node:assert/strict';
import {roomSql} from '../lib/postgres.ts';
test('room creation is isolated and conflict safe',()=>assert.equal(roomSql('INSERT OR IGNORE INTO rooms(code,revision,data,updated) VALUES(?,?,?,?)'),'INSERT INTO meowbomb.rooms(code,revision,data,updated) VALUES($1,$2,$3,$4) ON CONFLICT (code) DO NOTHING'));
test('revision compare-and-set survives conversion',()=>assert.equal(roomSql('UPDATE rooms SET data=?,revision=?,updated=? WHERE code=? AND revision=?'),'UPDATE meowbomb.rooms SET data=$1,revision=$2,updated=$3 WHERE code=$4 AND revision=$5'));
test('expiry cleanup scopes outer and inner table',()=>assert.equal(roomSql('DELETE FROM rooms WHERE code IN (SELECT code FROM rooms WHERE updated < ? LIMIT 20)'),'DELETE FROM meowbomb.rooms WHERE code IN (SELECT code FROM meowbomb.rooms WHERE updated < $1 LIMIT 20)'));
test('room reads are namespace qualified',()=>assert.equal(roomSql('SELECT data FROM rooms WHERE code=? AND updated>?'),'SELECT data FROM meowbomb.rooms WHERE code=$1 AND updated>$2'));
