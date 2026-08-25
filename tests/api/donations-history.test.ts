/**
 * Tests for GET /api/donations/history.
 *
 * Verifies:
 *  - 401 when unauthenticated
 *  - 400 on invalid query params
 *  - 200 with empty list when no donations
 *  - 200 with paginated, formatted donations
 *  - status + purpose filters forwarded to Prisma
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  prisma: {
    donation: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/session', () => ({ requireAuth: mocks.requireAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));

import { GET } from '@/app/api/donations/history/route';
import { UnauthorizedError } from '@/lib/errors';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/donations/history', () => {
  it('returns 401 when user is not authenticated', async () => {
    mocks.requireAuth.mockRejectedValueOnce(new UnauthorizedError());

    const res = await GET(new Request('http://localhost/api/donations/history'));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid status query', async () => {
    mocks.requireAuth.mockResolvedValueOnce({ user: { id: 'u1' } });
    const res = await GET(new Request('http://localhost/api/donations/history?status=BOGUS'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns empty list with total 0 when user has no donations', async () => {
    mocks.requireAuth.mockResolvedValueOnce({ user: { id: 'u1' } });
    mocks.prisma.donation.findMany.mockResolvedValueOnce([]);
    mocks.prisma.donation.count.mockResolvedValueOnce(0);

    const res = await GET(new Request('http://localhost/api/donations/history'));
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.donations).toEqual([]);
    expect(body.data.total).toBe(0);
    expect(body.data.page).toBe(1);
    expect(body.data.limit).toBe(20);
  });

  it('serializes Decimal amount + dates + maps rows', async () => {
    mocks.requireAuth.mockResolvedValueOnce({ user: { id: 'u1' } });
    mocks.prisma.donation.findMany.mockResolvedValueOnce([
      {
        id: 'd1',
        // Prisma Decimal shape — has a .toString() method
        amount: { toString: () => '500.00' },
        currency: 'BDT',
        purpose: 'GENERAL_FUND',
        status: 'SUCCESS',
        isAnonymous: false,
        bkashPaymentId: 'bp1',
        bkashTransactionId: 'bt1',
        createdAt: new Date('2026-01-01T10:00:00Z'),
        completedAt: new Date('2026-01-01T10:01:00Z'),
      },
    ]);
    mocks.prisma.donation.count.mockResolvedValueOnce(1);

    const res = await GET(new Request('http://localhost/api/donations/history?page=1&limit=20'));
    const body = await res.json();
    expect(body.data.donations).toHaveLength(1);
    expect(body.data.donations[0]).toMatchObject({
      id: 'd1',
      amount: '500.00',
      currency: 'BDT',
      purpose: 'GENERAL_FUND',
      status: 'SUCCESS',
      bkashPaymentId: 'bp1',
      bkashTransactionId: 'bt1',
      createdAt: '2026-01-01T10:00:00.000Z',
      completedAt: '2026-01-01T10:01:00.000Z',
    });
  });

  it('forwards status + purpose filters to Prisma where clause', async () => {
    mocks.requireAuth.mockResolvedValueOnce({ user: { id: 'u7' } });
    mocks.prisma.donation.findMany.mockResolvedValueOnce([]);
    mocks.prisma.donation.count.mockResolvedValueOnce(0);

    await GET(
      new Request(
        'http://localhost/api/donations/history?status=SUCCESS&purpose=EDUCATION&page=2&limit=5'
      )
    );

    expect(mocks.prisma.donation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'u7',
          status: 'SUCCESS',
          purpose: 'EDUCATION',
        },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      })
    );
  });
});
