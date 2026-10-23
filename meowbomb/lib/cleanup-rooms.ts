import { getRoomDatabase } from './postgres';
import { roomCutoff } from './room-expiry';

export async function cleanupExpiredRooms(now = Date.now()) {
  const cutoff = roomCutoff(now);
  // Recheck the timestamp on the outer delete: a concurrent heartbeat may revive
  // a candidate before the delete acquires its row lock.
  const result = await getRoomDatabase().prepare(
    'DELETE FROM rooms WHERE updated<=? AND code IN (SELECT code FROM rooms WHERE updated<=? LIMIT 1000)'
  ).bind(cutoff, cutoff).run();
  await getRoomDatabase().prepare('DELETE FROM meowbomb.creation_limits WHERE key IN (SELECT key FROM meowbomb.creation_limits WHERE reset_at<=? LIMIT 1000)').bind(now).run();
  return result.meta.changes;
}
