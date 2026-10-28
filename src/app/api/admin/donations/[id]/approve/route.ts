/**
 * POST /api/admin/donations/[id]/approve
 *
 * Admin marks a manually-submitted donation as SUCCESS:
 *   - status → SUCCESS
 *   - bkashTransactionId copied from Donation.trxId (the donor's
 *     submitted TrxID — what was actually sent through bKash)
 *   - completedAt = reviewedAt = now()
 *   - reviewedById = acting admin
 *   - optional adminNote
 *
 * Only works on PENDING donations that already have a TrxID. Approving
 * a donation without a TrxID would be skipping verification entirely.
 *
 * Idempotent: if the donation is already SUCCESS, returns the current
 * state without DB writes.
 */
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { ok, fail, parseJsonBody } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/audit';
import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors';
import { adminReviewSchema } from '@/lib/validation/donation';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();

    const rl = await rateLimit(
      `admin:donations:approve:${session.user.id}`,
      RATE_LIMITS.ADMIN_ACTION.max,
      RATE_LIMITS.ADMIN_ACTION.windowSeconds
    );
    requireRateLimit(rl);

    const { id } = await params;
    if (!id || typeof id !== 'string' || id.length > 64) {
      throw new ValidationError('Invalid donation id');
    }

    // Body is optional — admin may approve with no note.
    const body = await parseJsonBody(request, adminReviewSchema, { optional: true });

    const donation = await prisma.donation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        trxId: true,
        userId: true,
        amount: true,
        bkashTransactionId: true,
      },
    });

    if (!donation) throw new NotFoundError('Donation not found');

    if (donation.status === 'SUCCESS') {
      return ok({
        donationId: donation.id,
        status: donation.status,
        message: 'Already approved',
      });
    }
    if (donation.status !== 'PENDING') {
      throw new ConflictError(`Cannot approve donation in status ${donation.status}`);
    }
    if (!donation.trxId) {
      throw new ValidationError(
        'Donation has no TrxID — donor has not submitted payment proof yet'
      );
    }

    const now = new Date();
    // Conditional on PENDING so a concurrent approve/reject can't both win.
    const { count } = await prisma.donation.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'SUCCESS',
        bkashTransactionId: donation.trxId,
        completedAt: now,
        reviewedAt: now,
        reviewedById: session.user.id,
        adminNote: body.adminNote ?? null,
      },
    });
    if (count === 0) {
      const current = await prisma.donation.findUnique({ where: { id }, select: { status: true } });
      if (current?.status === 'SUCCESS') {
        return ok({ donationId: id, status: current.status, message: 'Already approved' });
      }
      throw new ConflictError('Donation already reviewed', 'ALREADY_REVIEWED');
    }

    await logSecurityEvent({
      action: 'DONATION_COMPLETED',
      userId: donation.userId ?? undefined,
      details: {
        donationId: id,
        amount: donation.amount.toString(),
        approvedBy: session.user.id,
      },
    });

    return ok({
      donationId: id,
      status: 'SUCCESS' as const,
      completedAt: now.toISOString(),
      reviewedAt: now.toISOString(),
    });
  } catch (error) {
    return fail(error);
  }
}
