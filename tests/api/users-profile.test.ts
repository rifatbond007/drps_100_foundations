/**
 * Tests for PATCH /api/users/profile — focused on the user feature
 * (validation + audit logging on profile update).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireActiveUser: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: new Date() }),
  requireRateLimit: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  requireActiveUser: mocks.requireActiveUser,
  requireAuth: mocks.requireActiveUser, // in case the route falls back
}));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/audit', () => ({ logSecurityEvent: mocks.logSecurityEvent }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mocks.rateLimit,
  requireRateLimit: mocks.requireRateLimit,
  RATE_LIMITS: {
    API_GENERAL: { max: 100, windowSeconds: 60 },
  },
}));

import { PATCH } from '@/app/api/users/profile/route';
import { UnauthorizedError } from '@/lib/errors';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/users/profile', () => {
  it('updates profile + audits PROFILE_UPDATED', async () => {
    mocks.requireActiveUser.mockResolvedValue({ user: { id: 'u1' } });
    mocks.prisma.user.update.mockResolvedValue({
      id: 'u1',
      name: 'New Name',
      phone: '+8801712345678',
      avatarUrl: null,
      languagePref: 'EN',
      updatedAt: new Date(),
    });

    const req = new Request('http://localhost/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name', phone: '+8801712345678', languagePref: 'EN' }),
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: {
          name: 'New Name',
          phone: '+8801712345678',
          languagePref: 'EN',
        },
      })
    );
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROFILE_UPDATED',
        userId: 'u1',
        details: { fields: expect.arrayContaining(['name', 'phone', 'languagePref']) },
      })
    );
  });

  it('rejects invalid Bangladesh phone with 400', async () => {
    mocks.requireActiveUser.mockResolvedValue({ user: { id: 'u1' } });
    const req = new Request('http://localhost/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '12345' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.logSecurityEvent).not.toHaveBeenCalled();
  });

  it('rejects invalid languagePref with 400', async () => {
    mocks.requireActiveUser.mockResolvedValue({ user: { id: 'u1' } });
    const req = new Request('http://localhost/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ languagePref: 'FR' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    mocks.requireActiveUser.mockRejectedValueOnce(new UnauthorizedError());

    const req = new Request('http://localhost/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });
});
