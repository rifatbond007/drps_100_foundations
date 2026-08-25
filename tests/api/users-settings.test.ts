/**
 * Tests for PUT /api/users/settings.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireActiveUser: vi.fn(),
  requireAuth: vi.fn(),
  prisma: {
    userSettings: {
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: new Date() }),
  requireRateLimit: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  requireAuth: mocks.requireAuth,
  requireActiveUser: mocks.requireActiveUser,
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

import { PUT } from '@/app/api/users/settings/route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PUT /api/users/settings', () => {
  it('updates settings and audits SETTINGS_UPDATED', async () => {
    mocks.requireActiveUser.mockResolvedValue({ user: { id: 'u1' } });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: 'u1', deletedAt: null });
    mocks.prisma.userSettings.upsert.mockResolvedValue({
      userId: 'u1',
      emailNotifications: false,
      donationReceipts: true,
      theme: 'dark',
    });

    const req = new Request('http://localhost/api/users/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailNotifications: false, theme: 'dark' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SETTINGS_UPDATED',
        userId: 'u1',
        details: { fields: expect.arrayContaining(['emailNotifications', 'theme']) },
      })
    );
  });

  it('rejects unknown theme value with 400', async () => {
    mocks.requireActiveUser.mockResolvedValue({ user: { id: 'u1' } });
    const req = new Request('http://localhost/api/users/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'magenta' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    expect(mocks.prisma.userSettings.upsert).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON with 400', async () => {
    mocks.requireActiveUser.mockResolvedValue({ user: { id: 'u1' } });
    const req = new Request('http://localhost/api/users/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});
