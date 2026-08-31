/**
 * GET /api/admin/donations
 *
 * Admin-only listing of donations awaiting review (and a few recent
 * terminal ones for context). Powers /admin/donations.
 *
 * Query params:
 *   ?status=PENDING|SUCCESS|FAILED|CANCELLED (default PENDING)
 *   ?page, ?limit (default 1 / 20, max 100)
 *
 * Pending donations are sorted by trxSubmittedAt ASC so the ones that
 * have been waiting the longest surface first — admins shouldn't have
 * to scroll past today's submissions to find yesterday's stuck ones.
 */
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const rl = await rateLimit(
      `admin:donations:list:${session.user.id}`,
      RATE_LIMITS.ADMIN_ACTION.max,
      RATE_LIMITS.ADMIN_ACTION.windowSeconds
    );
    requireRateLimit(rl);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'PENDING';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')));

    if (!['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'].includes(status)) {
      return fail(new Error('Invalid status'));
    }

    const where: Prisma.DonationWhereInput = {
      status: status as 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED',
    };

    // For PENDING show only the ones the donor has already submitted a
    // TrxID for (so the admin has something to verify). Pure-PENDING
    // rows without a TrxID are orphans the donor abandoned and stay
    // hidden from the admin queue — they don't need action.
    if (status === 'PENDING') {
      where.trxId = { not: null };
    }

    const [rows, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        orderBy:
          status === 'PENDING'
            ? [{ trxSubmittedAt: 'asc' }, { createdAt: 'asc' }]
            : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          amount: true,
          currency: true,
          purpose: true,
          status: true,
          isAnonymous: true,
          trxId: true,
          senderPhone: true,
          trxSubmittedAt: true,
          reviewedAt: true,
          adminNote: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),
      prisma.donation.count({ where }),
    ]);

    return ok({
      donations: rows.map((d) => ({
        id: d.id,
        userId: d.userId,
        amount: d.amount.toString(),
        currency: d.currency,
        purpose: d.purpose,
        status: d.status,
        isAnonymous: d.isAnonymous,
        trxId: d.trxId,
        senderPhone: d.senderPhone,
        trxSubmittedAt: d.trxSubmittedAt?.toISOString() ?? null,
        reviewedAt: d.reviewedAt?.toISOString() ?? null,
        adminNote: d.adminNote,
        createdAt: d.createdAt.toISOString(),
        donor: d.isAnonymous
          ? null
          : d.user
            ? {
                id: d.user.id,
                name: d.user.name,
                email: d.user.email,
                avatarUrl: d.user.avatarUrl,
              }
            : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return fail(error);
  }
}
