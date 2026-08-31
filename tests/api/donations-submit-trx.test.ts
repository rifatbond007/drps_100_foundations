/**
 * Tests for POST /api/donations/[id]/submit-trx.
 *
 * Donor-side endpoint that attaches the bKash TrxID + sender phone
 * after the donor sent money to the foundation's personal bKash.
 *
 * Verifies:
 *  - 401 when not authenticated
 *  - 403 when the donation belongs to another user
 *  - 400 validation errors (bad TrxID, bad phone)
 *  - 400 when donation already has a TrxID (no double-submit)
 *  - 400 when TrxID collides with another donation's TrxID
 *  - 200 happy path: persists trxId + senderPhone, audit-logs
 *    DONATION_TRX_SUBMITTED with a prefix only (privacy)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireActiveUser: vi.fn(),
  prisma: {
    donation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/session', () => ({ requireActiveUser: mocks.requireActiveUser }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/audit', () => ({ logSecurityEvent: mocks.logSecurityEvent }));

import { POST } from '@/app/api/donations/[id]/submit-trx/route';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

const VALID = { trxId: 'TRX12345', senderPhone: '01712345678' };

function buildReq(body: unknown): NextRequest {
  return new Request('http://localhost/api/donations/d1/submit-trx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/donations/[id]/submit-trx', () => {
  it('returns 401 when not authenticated', async () => {
    mocks.requireActiveUser.mockRejectedValueOnce(new UnauthorizedError());
    const res = await POST(buildReq(VALID), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid TrxID', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', languagePref: 'BN' },
    });
    const res = await POST(buildReq({ ...VALID, trxId: 'no' }), {
      params: Promise.resolve({ id: 'd1' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid sender phone', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', languagePref: 'BN' },
    });
    const res = await POST(buildReq({ ...VALID, senderPhone: '12345' }), {
      params: Promise.resolve({ id: 'd1' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 403 when donation belongs to another user', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', languagePref: 'BN' },
    });
    mocks.prisma.donation.findUnique.mockResolvedValueOnce({
      id: 'd1',
      userId: 'someone-else',
      status: 'PENDING',
      trxId: null,
      senderPhone: null,
      bkashTransactionId: null,
    });
    const res = await POST(buildReq(VALID), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 400 when donation already has a TrxID', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', languagePref: 'BN' },
    });
    mocks.prisma.donation.findUnique.mockResolvedValueOnce({
      id: 'd1',
      userId: 'u1',
      status: 'PENDING',
      trxId: 'ALREADY-SET',
      senderPhone: null,
      bkashTransactionId: null,
    });
    const res = await POST(buildReq(VALID), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(400);
    expect(mocks.prisma.donation.update).not.toHaveBeenCalled();
  });

  it('returns 400 when TrxID collides with another donation', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', languagePref: 'BN' },
    });
    mocks.prisma.donation.findUnique.mockResolvedValueOnce({
      id: 'd1',
      userId: 'u1',
      status: 'PENDING',
      trxId: null,
      senderPhone: null,
      bkashTransactionId: null,
    });
    mocks.prisma.donation.findFirst.mockResolvedValueOnce({ id: 'd-other' });

    const res = await POST(buildReq(VALID), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(400);
    expect(mocks.prisma.donation.update).not.toHaveBeenCalled();
  });

  it('happy path: persists TrxID + phone, audit-logs prefix only', async () => {
    mocks.requireActiveUser.mockResolvedValueOnce({
      user: { id: 'u1', role: 'USER', languagePref: 'BN' },
    });
    mocks.prisma.donation.findUnique.mockResolvedValueOnce({
      id: 'd1',
      userId: 'u1',
      status: 'PENDING',
      trxId: null,
      senderPhone: null,
      bkashTransactionId: null,
    });
    mocks.prisma.donation.findFirst.mockResolvedValueOnce(null);
    mocks.prisma.donation.update.mockResolvedValueOnce({
      id: 'd1',
      status: 'PENDING',
      trxId: 'TRX12345',
      senderPhone: '01712345678',
    });

    const res = await POST(buildReq(VALID), { params: Promise.resolve({ id: 'd1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.trxId).toBe('TRX12345');
    expect(body.data.redirectUrl).toContain('/donate/pending');

    expect(mocks.prisma.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'd1' },
        data: expect.objectContaining({
          trxId: 'TRX12345',
          senderPhone: '01712345678',
        }),
      })
    );
    // Audit log uses prefix-only — full TrxID does not leak to logs.
    expect(mocks.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DONATION_TRX_SUBMITTED',
        details: expect.objectContaining({
          trxIdPrefix: 'TRX1',
          senderPhoneSuffix: '5678',
        }),
      })
    );
  });
});
