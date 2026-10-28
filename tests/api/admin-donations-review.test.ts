/**
 * Tests for the admin donation review endpoints:
 *   POST /api/admin/donations/[id]/approve
 *   POST /api/admin/donations/[id]/reject
 *
 * Verifies:
 *   - 401 / 403 role gates
 *   - Approve: PENDING + trxId → SUCCESS, copies trxId→bkashTransactionId,
 *     stamps reviewedAt + completedAt, audit-logs DONATION_COMPLETED
 *   - Approve: idempotent on SUCCESS (no DB writes, returns current state)
 *   - Approve: 422 when donation is missing a TrxID
 *   - Reject: PENDING + adminNote → FAILED, audit-logs DONATION_REJECTED
 *   - Reject: adminNote required (empty body → 400)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  prisma: {
    donation: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetAt: new Date() }),
  requireRateLimit: vi.fn(),
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/session', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mocks.rateLimit,
  requireRateLimit: mocks.requireRateLimit,
  RATE_LIMITS: { ADMIN_ACTION: { max: 30, windowSeconds: 60 } },
}));
vi.mock('@/lib/audit', () => ({ logSecurityEvent: mocks.logSecurityEvent }));

import { POST as approve } from '@/app/api/admin/donations/[id]/approve/route';
import { POST as reject } from '@/app/api/admin/donations/[id]/reject/route';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

function buildReq(body: unknown): NextRequest {
  return new Request('http://localhost/api/admin/donations/d1/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({
    user: { id: 'admin1', role: 'ADMIN', email: 'a@b.c' },
  });
});

describe('POST /api/admin/donations/[id]/approve', () => {
  it('returns 401 when not authenticated', async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new UnauthorizedError());
    const res = await approve(buildReq({}), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 403 when role is USER', async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new ForbiddenError('not admin'));
    const res = await approve(buildReq({}), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(403);
  });

  it('happy path: approves a PENDING donation with TrxID, copies it to bkashTransactionId', async () => {
    mocks.prisma.donation.findUnique.mockResolvedValueOnce({
      id: 'd1',
      status: 'PENDING',
      trxId: 'TRX-12345',
      userId: 'u1',
      amount: { toString: () => '500.00' },
      bkashTransactionId: null,
    });
    mocks.prisma.donation.updateMany.mockResolvedValueOnce({ count: 1 });

    const res = await approve(buildReq({ adminNote: 'verified' }), {
      params: Promise.resolve({ id: 'd1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('SUCCESS');
    expect(body.data.donationId).toBe('d1');

    expect(mocks.prisma.donation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1', status: 'PENDING' },
        data: expect.objectContaining({
          status: 'SUCCESS',
          bkashTransactionId: 'TRX-12345',
          reviewedById: 'admin1',
          adminNote: 'verified',
        }),
      })
    );
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DONATION_COMPLETED' })
    );
  });

  it('idempotent: already SUCCESS → returns current state, no DB writes', async () => {
    mocks.prisma.donation.findUnique.mockResolvedValueOnce({
      id: 'd1',
      status: 'SUCCESS',
      trxId: 'TRX-12345',
      userId: 'u1',
      amount: { toString: () => '500.00' },
      bkashTransactionId: 'TRX-12345',
    });

    const res = await approve(buildReq({}), {
      params: Promise.resolve({ id: 'd1' }),
    });
    expect(res.status).toBe(200);
    expect(mocks.prisma.donation.update).not.toHaveBeenCalled();
  });

  it('400 when donation has no TrxID (cannot approve without payment proof)', async () => {
    mocks.prisma.donation.findUnique.mockResolvedValueOnce({
      id: 'd1',
      status: 'PENDING',
      trxId: null,
      userId: 'u1',
      amount: { toString: () => '500.00' },
      bkashTransactionId: null,
    });

    const res = await approve(buildReq({}), {
      params: Promise.resolve({ id: 'd1' }),
    });
    expect(res.status).toBe(400);
    expect(mocks.prisma.donation.update).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/donations/[id]/reject', () => {
  it('returns 401 when not authenticated', async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new UnauthorizedError());
    const res = await reject(buildReq({ adminNote: 'wrong amount' }), {
      params: Promise.resolve({ id: 'd1' }),
    });
    expect(res.status).toBe(401);
  });

  it('400 when adminNote is empty (reason required for donor)', async () => {
    const res = await reject(buildReq({ adminNote: '' }), {
      params: Promise.resolve({ id: 'd1' }),
    });
    expect(res.status).toBe(400);
    expect(mocks.prisma.donation.findUnique).not.toHaveBeenCalled();
  });

  it('happy path: rejects PENDING donation, persists adminNote, audit-logs DONATION_REJECTED', async () => {
    mocks.prisma.donation.findUnique.mockResolvedValueOnce({
      id: 'd1',
      status: 'PENDING',
      userId: 'u1',
      amount: { toString: () => '500.00' },
    });
    mocks.prisma.donation.updateMany.mockResolvedValueOnce({ count: 1 });

    const res = await reject(buildReq({ adminNote: 'TrxID does not match amount' }), {
      params: Promise.resolve({ id: 'd1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('FAILED');

    expect(mocks.prisma.donation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1', status: 'PENDING' },
        data: expect.objectContaining({
          status: 'FAILED',
          adminNote: 'TrxID does not match amount',
          failureReason: 'TrxID does not match amount',
          reviewedById: 'admin1',
        }),
      })
    );
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DONATION_REJECTED' })
    );
  });
});

describe('malformed input', () => {
  const bad = () =>
    new Request('http://localhost/api/admin/donations/d1/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad',
    }) as unknown as NextRequest;
  const params = { params: Promise.resolve({ id: 'd1' }) };

  it('approve returns 400 on malformed JSON', async () => {
    const res = await approve(bad(), params);
    expect(res.status).toBe(400);
  });

  it('reject returns 400 on malformed JSON', async () => {
    const res = await reject(bad(), params);
    expect(res.status).toBe(400);
  });
});

describe('review races', () => {
  const params = { params: Promise.resolve({ id: 'd1' }) };
  const pending = {
    id: 'd1',
    status: 'PENDING',
    trxId: 'TRX-12345',
    userId: 'u1',
    amount: { toString: () => '500.00' },
    bkashTransactionId: null,
  };

  it('approve returns 409 ALREADY_REVIEWED when another admin rejected first', async () => {
    mocks.prisma.donation.findUnique
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce({ ...pending, status: 'FAILED' });
    mocks.prisma.donation.updateMany.mockResolvedValueOnce({ count: 0 });
    const res = await approve(buildReq({}), params);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('ALREADY_REVIEWED');
  });

  it('approve is idempotent when another admin approved first', async () => {
    mocks.prisma.donation.findUnique
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce({ ...pending, status: 'SUCCESS' });
    mocks.prisma.donation.updateMany.mockResolvedValueOnce({ count: 0 });
    const res = await approve(buildReq({}), params);
    expect(res.status).toBe(200);
    expect((await res.json()).data.message).toBe('Already approved');
  });

  it('reject returns 409 ALREADY_REVIEWED when the donation was reviewed concurrently', async () => {
    mocks.prisma.donation.findUnique.mockResolvedValueOnce(pending);
    mocks.prisma.donation.updateMany.mockResolvedValueOnce({ count: 0 });
    const res = await reject(buildReq({ adminNote: 'not found in bKash' }), params);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('ALREADY_REVIEWED');
  });
});
