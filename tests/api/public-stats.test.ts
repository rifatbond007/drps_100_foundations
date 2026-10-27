import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/stats', () => ({
  getPublicStats: vi.fn().mockResolvedValue({
    totalRaised: '10',
    donorCount: 1,
    donationCount: 1,
    byPurpose: {},
    updatedAt: 'x',
  }),
}));

import { GET } from '@/app/api/public/stats/route';

describe('GET /api/public/stats', () => {
  it('returns stats with a public cache header', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=300'
    );
    expect((await res.json()).data.totalRaised).toBe('10');
  });
});
