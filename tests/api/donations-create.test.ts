/**
 * Tests for POST /api/donations/create.
 *
 * Manual bKash flow (no payment provider call):
 *  - 401 when unauthenticated
 *  - 403 when role === 'ADMIN'
 *  - 200 even when profile is incomplete (profile completion is NOT a
 *    requirement for donating)
 *  - 400 on bad payload (amount out of range, bad purpose)
 *  - 200 happy path: creates Donation(PENDING), returns
 *    { donationId, paymentMethod, nextStep: 'submit-trx' }
 *  - Idempotency: a duplicate POST with the same idempotencyKey returns
 *    the cached response without a second DB write
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireActiveUser: vi.fn(),
  prisma: {
    donation: {
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
  redis: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 2, resetAt: new Date() }),
  requireRateLimit: vi.fn(),
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/session', () => ({ requireActiveUser: mocks.requireActiveUser }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/redis', () => ({ redis: mocks.redis }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mocks.rateLimit,
  requireRateLimit: mocks.requireRateLimit,
  RATE_LIMITS: {
    DONATION_CREATE: { max: 3, windowSeconds: 300 },
  },
}));
vi.mock('@/lib/audit', () => ({ logSecurityEvent: mocks.logSecurityEvent }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
// No payment-provider client is mocked here — manual flow means the
// route never calls one. Test fails fast if we accidentally re-introduce
// the dependency.
vi.mock('@/lib/payment', () => ({
  PAYMENT_METHOD: 'manual_bkash',
  PAYMENT_INSTRUCTIONS: { method: 'bKash (Personal)', number: '01616413419', referenceHint: '' },
}));

import { POST } from '@/app/api/donations/create/route';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

const VALID_BODY = {
  amount: 500,
  purpose: 'GENERAL_FUND',
  isAnonymous: false,
  idempotencyKey: '11111111-1111-1111-1111-111111111111',
};

function buildReq(body: unknown): NextRequest {
  return new Request('http://localhost/api/donations/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redis.get.mockResolvedValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/donations/create', () => {
  it('returns 401 when not authenticated', async () => {
    mocks.requireActiveUser.mockRejectedValueOnce(new UnauthorizedError());
    const res = await POST(buildReq(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 403 when role === ADMIN', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'a1', role: 'ADMIN', profileCompleted: true, languagePref: 'BN' },
    });
    const res = await POST(buildReq(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it('returns 200 when profile is incomplete (profile is NOT required to donate)', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', profileCompleted: false, languagePref: 'BN' },
    });
    mocks.prisma.donation.create.mockResolvedValueOnce({ id: 'd1', amount: '500' });

    const res = await POST(buildReq(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.donationId).toBe('d1');
    expect(body.data.paymentMethod).toBe('manual_bkash');
    expect(body.data.nextStep).toBe('submit-trx');
  });

  it('returns 400 on invalid amount', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', profileCompleted: true, languagePref: 'BN' },
    });
    const res = await POST(buildReq({ ...VALID_BODY, amount: 1 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 400 on invalid purpose', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', profileCompleted: true, languagePref: 'BN' },
    });
    const res = await POST(buildReq({ ...VALID_BODY, purpose: 'NOT_A_PURPOSE' }));
    expect(res.status).toBe(400);
  });

  it('happy path: creates PENDING donation, returns submit-trx next step', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', profileCompleted: true, languagePref: 'BN' },
    });
    mocks.prisma.donation.create.mockResolvedValueOnce({ id: 'd1', amount: '500' });

    const res = await POST(buildReq(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      donationId: 'd1',
      paymentMethod: 'manual_bkash',
      nextStep: 'submit-trx',
    });

    // The donation is inserted as PENDING with the manual payment method.
    expect(mocks.prisma.donation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING',
          paymentMethod: 'manual_bkash',
        }),
      })
    );
    // paymentId mirrors donationId so the field stays non-null.
    expect(mocks.prisma.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: { bkashPaymentId: 'd1' },
      })
    );
    // Audit log fired.
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DONATION_INITIATED', userId: 'u1' })
    );
  });

  it('idempotent: duplicate idempotencyKey returns cached response, no second create', async () => {
    const cached = {
      success: true,
      data: { donationId: 'd1', paymentMethod: 'manual_bkash', nextStep: 'submit-trx' },
    };
    mocks.redis.get.mockResolvedValueOnce(JSON.stringify(cached));
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', profileCompleted: true, languagePref: 'BN' },
    });

    const res = await POST(buildReq(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mocks.prisma.donation.create).not.toHaveBeenCalled();
  });
});

describe('Error shape parity', () => {
  it('ForbiddenError is an Error subclass (parity with previous suite)', () => {
    expect(new ForbiddenError('x')).toBeInstanceOf(Error);
  });
});
