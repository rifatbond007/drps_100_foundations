import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: { $queryRaw: vi.fn().mockRejectedValue(new Error('password=secret host=db')) },
}));
vi.mock('@/lib/redis', () => ({ redis: { ping: vi.fn().mockResolvedValue('PONG') } }));

import { GET } from '@/app/api/health/route';

describe('GET /api/health?deep=1', () => {
  it('reports a failed dependency without leaking its error text', async () => {
    const res = await GET(new Request('http://localhost/api/health?deep=1'));
    const text = await res.text();
    expect(res.status).toBe(503);
    expect(text).not.toContain('secret');
    expect(JSON.parse(text).data.services.postgres.ok).toBe(false);
  });
});
