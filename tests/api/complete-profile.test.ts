/**
 * Tests for POST /api/users/complete-profile — first-time onboarding.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/session', () => ({ requireAuth: mocks.requireAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/audit', () => ({ logSecurityEvent: mocks.logSecurityEvent }));

import { POST } from '@/app/api/users/complete-profile/route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/users/complete-profile', () => {
  it('saves phone + language, flips profileCompleted, audits PROFILE_COMPLETED', async () => {
    mocks.requireAuth.mockResolvedValueOnce({ user: { id: 'u1' } });
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      profileCompleted: false,
    });
    mocks.prisma.user.update.mockResolvedValueOnce({
      id: 'u1',
      phone: '+8801712345678',
      languagePref: 'EN',
      profileCompleted: true,
    });

    const req = new Request('http://localhost/api/users/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+8801712345678', languagePref: 'EN' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.profileCompleted).toBe(true);
    expect(mocks.prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: {
          phone: '+8801712345678',
          languagePref: 'EN',
          profileCompleted: true,
        },
      })
    );
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PROFILE_COMPLETED',
        userId: 'u1',
        details: { languagePref: 'EN' },
      })
    );
  });

  it('returns 409 ConflictError if profile already completed', async () => {
    mocks.requireAuth.mockResolvedValueOnce({ user: { id: 'u1' } });
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      profileCompleted: true,
    });

    const req = new Request('http://localhost/api/users/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+8801712345678', languagePref: 'EN' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('CONFLICT');
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects invalid phone with 400', async () => {
    mocks.requireAuth.mockResolvedValueOnce({ user: { id: 'u1' } });
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      profileCompleted: false,
    });

    const req = new Request('http://localhost/api/users/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '12', languagePref: 'BN' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
