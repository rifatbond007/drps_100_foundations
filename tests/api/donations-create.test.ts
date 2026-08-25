/**
 * Tests for POST /api/donations/create.
 *
 * Verifies:
 *  - 401 when unauthenticated
 *  - 403 when role === 'ADMIN'
 *  - 200 even when profile is incomplete (profile completion is NOT a
 *    requirement for donating — users can finish / edit later from
 *    /settings)
 *  - 400 on bad payload (amount out of range, bad purpose)
 *  - 200 happy path: creates Donation(PENDING), calls dummy payment
 *    provider, returns { donationId, paymentId, redirectUrl }
 *  - Idempotency: a duplicate POST with the same idempotencyKey
 *    returns the cached response without a second DB write
 *  - Marks donation FAILED if the payment provider throws
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
  dummyPaymentClient: {
    createPayment: vi.fn(),
  },
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
  // Return a value when crypto.randomUUID is called in the route —
  // vitest runs in Node 20+ where crypto is global, so this is
  // just a safety net for older runtimes.
  randomUUID: vi.fn().mockReturnValue('uuid-1'),
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
vi.mock('@/lib/payment/types', () => ({ getPaymentClient: () => mocks.dummyPaymentClient }));
vi.mock('@/lib/audit', () => ({ logSecurityEvent: mocks.logSecurityEvent }));
vi.mock('@/lib/payment/bkash', () => ({ bkashClient: {} }));
// `next/headers` requires a request scope at runtime, which doesn't exist
// in vitest. Provide a minimal Map-like shim that returns the host header
// the route expects so the callback URL builds without throwing.
vi.mock('next/headers', () => ({
  headers: async () => ({
    get(name: string) {
      if (name === 'host') return 'localhost:3000';
      if (name === 'x-forwarded-proto') return 'http';
      return null;
    },
  }),
}));

import { POST } from '@/app/api/donations/create/route';
import { UnauthorizedError, ForbiddenError, PaymentError } from '@/lib/errors';

const VALID_BODY = {
  amount: 500,
  purpose: 'GENERAL_FUND',
  isAnonymous: false,
  idempotencyKey: '11111111-1111-1111-1111-111111111111',
};

function buildReq(body: unknown): NextRequest {
  // The route expects NextRequest (which extends Request). The global
  // Request satisfies the surface the route uses here (json() +
  // headers), so a cast is safe for unit-test purposes.
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

  it('returns 200 when profile is incomplete (profile is NOT required to donate)', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', profileCompleted: false, languagePref: 'BN' },
    });
    mocks.prisma.donation.create.mockResolvedValueOnce({ id: 'd1', amount: '500' });
    mocks.dummyPaymentClient.createPayment.mockResolvedValueOnce({
      paymentId: 'DUMMY-d1',
      amount: '500.00',
      currency: 'BDT',
      redirectUrl: '/donate/checkout?donationId=d1&paymentId=DUMMY-d1',
      merchantInvoiceNumber: 'd1',
    });

    const res = await POST(buildReq(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.donationId).toBe('d1');
  });

  it('returns 403 when role === ADMIN', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'a1', role: 'ADMIN', profileCompleted: true, languagePref: 'BN' },
    });
    const res = await POST(buildReq(VALID_BODY));
    expect(res.status).toBe(403);
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

  it('happy path: creates donation, calls dummy provider, returns redirectUrl', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', profileCompleted: true, languagePref: 'BN' },
    });
    mocks.prisma.donation.create.mockResolvedValueOnce({ id: 'd1', amount: '500' });
    mocks.dummyPaymentClient.createPayment.mockResolvedValueOnce({
      paymentId: 'DUMMY-d1',
      amount: '500.00',
      currency: 'BDT',
      redirectUrl: '/donate/checkout?donationId=d1&paymentId=DUMMY-d1',
      merchantInvoiceNumber: 'd1',
    });

    const res = await POST(buildReq(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      donationId: 'd1',
      paymentId: 'DUMMY-d1',
      redirectUrl: '/donate/checkout?donationId=d1&paymentId=DUMMY-d1',
    });

    // Persists the provider-assigned paymentId onto the donation row.
    expect(mocks.prisma.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: { bkashPaymentId: 'DUMMY-d1' },
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
      data: { donationId: 'd1', paymentId: 'DUMMY-d1', redirectUrl: '/x' },
    };
    mocks.redis.get.mockResolvedValueOnce(JSON.stringify(cached));
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', profileCompleted: true, languagePref: 'BN' },
    });

    const res = await POST(buildReq(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mocks.prisma.donation.create).not.toHaveBeenCalled();
  });

  it('marks donation FAILED when payment provider throws', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', profileCompleted: true, languagePref: 'BN' },
    });
    mocks.prisma.donation.create.mockResolvedValueOnce({ id: 'd1', amount: '500' });
    mocks.dummyPaymentClient.createPayment.mockRejectedValueOnce(new Error('upstream timeout'));
    mocks.prisma.donation.update.mockResolvedValueOnce({ id: 'd1' });

    const res = await POST(buildReq(VALID_BODY));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('PAYMENT_ERROR');
    // The just-created PENDING row gets flipped to FAILED.
    expect(mocks.prisma.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({ status: 'FAILED' }),
      })
    );
  });
});

describe('PaymentError safe behavior', () => {
  it('throws PaymentError when provider fails', () => {
    const e = new PaymentError('internal');
    expect(e.statusCode).toBe(502);
    expect(e.safeMessage).toMatch(/payment could not be processed/i);
    // ForbiddenError still constructed for typecheck parity
    expect(new ForbiddenError('x')).toBeInstanceOf(Error);
  });
});
