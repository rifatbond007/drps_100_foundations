/**
 * GET /api/public/stats — approved donation totals for public pages.
 * No auth. Cached 60s in Redis and at the CDN.
 */
import { ok, fail } from '@/lib/api/helpers';
import { getPublicStats } from '@/lib/stats';

export async function GET() {
  try {
    return ok(await getPublicStats(), {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    return fail(error, { route: 'public/stats', method: 'GET' });
  }
}
