import { getRoomDatabase } from './postgres';
import { roomCutoff } from './room-expiry';

export async function cleanupExpiredRooms(now = Date.now()) {
  const cutoff = roomCutoff(now);
  // Recheck the timestamp on the outer delete: a concurrent heartbeat may revive
  // a candidate before the delete acquires its row lock.
  const result = await getRoomDatabase().prepare(
    'DELETE FROM rooms WHERE updated<=? AND code IN (SELECT code FROM rooms WHERE updated<=? LIMIT 1000)'
  ).bind(cutoff, cutoff).run();
  return result.meta.changes;
}
