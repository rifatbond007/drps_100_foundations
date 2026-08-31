/**
 * GET /api/donations/history
 *
 * Returns the authenticated user's donation history with pagination + filters.
 *
 * Query params (all optional):
 *   page    — 1-based page number (default 1)
 *   limit   — page size, 1..100 (default 20)
 *   status  — PENDING | SUCCESS | FAILED | CANCELLED
 *   purpose — GENERAL_FUND | EDUCATION | MEDICAL | EMERGENCY
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { donationHistoryQuerySchema } from '@/lib/validation/donation';
import type { Donation, DonationHistoryResponse } from '@/types/donation';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    const url = new URL(request.url);
    const rawQuery = Object.fromEntries(url.searchParams.entries());
    const parsed = donationHistoryQuerySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { page, limit, status, purpose } = parsed.data;

    const where = {
      userId: session.user.id,
      ...(status && { status }),
      ...(purpose && { purpose }),
    };

    const [rows, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.donation.count({ where }),
    ]);

    const donations: Donation[] = rows.map((d) => ({
      id: d.id,
      // Prisma Decimal → string for stable JSON serialization.
      amount: d.amount.toString(),
      currency: d.currency,
      purpose: d.purpose,
      status: d.status,
      isAnonymous: d.isAnonymous,
      bkashPaymentId: d.bkashPaymentId,
      bkashTransactionId: d.bkashTransactionId,
      createdAt: d.createdAt.toISOString(),
      completedAt: d.completedAt ? d.completedAt.toISOString() : null,
      trxId: d.trxId,
      trxSubmittedAt: d.trxSubmittedAt ? d.trxSubmittedAt.toISOString() : null,
      adminNote: d.adminNote,
    }));

    const body: DonationHistoryResponse = {
      donations,
      total,
      page,
      limit,
    };
    return ok(body);
  } catch (error) {
    return fail(error);
  }
}
