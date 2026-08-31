/**
 * POST /api/admin/donations/[id]/reject
 *
 * Admin rejects a manually-submitted donation (TrxID didn't verify,
 * amount wrong, etc.). Marks it FAILED with the admin's note so the
 * donor sees why and can resubmit.
 *
 * Idempotent on terminal states.
 */
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/audit';
import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors';
import { adminReviewSchema } from '@/lib/validation/donation';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();

    const rl = await rateLimit(
      `admin:donations:reject:${session.user.id}`,
      RATE_LIMITS.ADMIN_ACTION.max,
      RATE_LIMITS.ADMIN_ACTION.windowSeconds
    );
    requireRateLimit(rl);

    const { id } = await params;
    if (!id || typeof id !== 'string' || id.length > 64) {
      throw new ValidationError('Invalid donation id');
    }

    let body: z.infer<typeof adminReviewSchema>;
    try {
      const text = await request.text();
      body = text ? adminReviewSchema.parse(JSON.parse(text)) : {};
    } catch (error) {
      if (error instanceof z.ZodError) return fail(error);
      throw error;
    }

    // Reject requires a reason — without it the donor can't tell what
    // went wrong and would resubmit the same TrxID.
    if (!body.adminNote || body.adminNote.trim().length === 0) {
      throw new ValidationError('adminNote is required when rejecting');
    }

    const donation = await prisma.donation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        userId: true,
        amount: true,
      },
    });

    if (!donation) throw new NotFoundError('Donation not found');
    if (donation.status === 'FAILED' || donation.status === 'CANCELLED') {
      return ok({ donationId: donation.id, status: donation.status, message: 'Already rejected' });
    }
    if (donation.status === 'SUCCESS') {
      throw new ConflictError('Cannot reject an already-approved donation — refund out of band');
    }
    if (donation.status !== 'PENDING') {
      throw new ConflictError(`Cannot reject donation in status ${donation.status}`);
    }

    const now = new Date();
    const updated = await prisma.donation.update({
      where: { id },
      data: {
        status: 'FAILED',
        failureReason: body.adminNote,
        completedAt: now,
        reviewedAt: now,
        reviewedById: session.user.id,
        adminNote: body.adminNote,
      },
      select: { id: true, status: true, completedAt: true, reviewedAt: true },
    });

    await logSecurityEvent({
      action: 'DONATION_REJECTED',
      userId: donation.userId ?? undefined,
      details: {
        donationId: updated.id,
        amount: donation.amount.toString(),
        rejectedBy: session.user.id,
      },
    });

    return ok({
      donationId: updated.id,
      status: updated.status,
      completedAt: updated.completedAt?.toISOString(),
      reviewedAt: updated.reviewedAt?.toISOString(),
    });
  } catch (error) {
    return fail(error);
  }
}
