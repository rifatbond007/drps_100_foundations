import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  update: vi.fn(),
}));
vi.mock('@/lib/auth/session', () => ({
  requireAuth: mocks.requireAuth,
  requireAdmin: mocks.requireAdmin,
}));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { update: mocks.update } } }));
vi.mock('@/lib/audit', () => ({ logSecurityEvent: vi.fn() }));

import { POST } from '@/app/api/auth/session/refresh/route';

beforeEach(() => {
  mocks.requireAuth.mockResolvedValue({ user: { id: 'ckadmin0000000000000000a', role: 'ADMIN' } });
  mocks.requireAdmin.mockResolvedValue({ user: { id: 'ckadmin0000000000000000a', role: 'ADMIN' } });
});

describe('POST /api/auth/session/refresh', () => {
  it('returns 404 when the target user does not exist', async () => {
    mocks.update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('not found', { code: 'P2025', clientVersion: 'x' })
    );
    const res = await POST(
      new Request('http://localhost/api/auth/session/refresh?userId=ckmissing00000000000000a', {
        method: 'POST',
      })
    );
    expect(res.status).toBe(404);
  });
});
