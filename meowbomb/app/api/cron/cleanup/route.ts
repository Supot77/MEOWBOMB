import { timingSafeEqual } from 'node:crypto';
import { cleanupExpiredRooms } from '../../../../lib/cleanup-rooms';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: 'Cleanup is not configured' }, { status: 503 });
  const actual = Buffer.from(req.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const deleted = await cleanupExpiredRooms();
    return Response.json({ deleted, batchLimit: 1000 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
