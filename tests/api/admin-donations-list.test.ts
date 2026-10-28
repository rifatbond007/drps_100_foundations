import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  prisma: {
    donation: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
  },
}));
vi.mock('@/lib/auth/session', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 1, resetAt: new Date() }),
  requireRateLimit: vi.fn(),
  RATE_LIMITS: { ADMIN_ACTION: { max: 30, windowSeconds: 60 } },
}));

import { GET } from '@/app/api/admin/donations/route';

const get = (qs: string) =>
  GET(new Request(`http://localhost/api/admin/donations${qs}`) as unknown as NextRequest);

beforeEach(() => {
  mocks.requireAdmin.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } });
});

describe('GET /api/admin/donations query validation', () => {
  it('returns 400 for a non-numeric page', async () => {
    expect((await get('?page=abc')).status).toBe(400);
  });

  it('returns 400 for an unknown status', async () => {
    expect((await get('?status=NOPE')).status).toBe(400);
  });

  it('returns 200 for valid params', async () => {
    expect((await get('?status=PENDING&page=1')).status).toBe(200);
  });
});
