/**
 * GET /api/donations/[id]
 *
 * Returns a single donation belonging to the calling user. Used by the
 * in-app dummy checkout page to display amount / purpose / donor name
 * before the user clicks Pay.
 *
 * Ownership: only the user who created the donation can read it. If
 * the donation has been soft-deleted (user row SetNull on cascade),
 * returns 404.
 */
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveUser();
    const { id } = await params;

    if (!id || typeof id !== 'string' || id.length > 64) {
      throw new ValidationError('Invalid donation id');
    }

    const donation = await prisma.donation.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        purpose: true,
        status: true,
        isAnonymous: true,
        bkashPaymentId: true,
        bkashTransactionId: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!donation) throw new NotFoundError('Donation not found');
    if (!donation.userId || donation.userId !== session.user.id) {
      throw new ForbiddenError('You cannot view this donation');
    }

    return ok({
      donation: {
        id: donation.id,
        amount: donation.amount.toString(),
        currency: donation.currency,
        purpose: donation.purpose,
        status: donation.status,
        isAnonymous: donation.isAnonymous,
        bkashPaymentId: donation.bkashPaymentId,
        bkashTransactionId: donation.bkashTransactionId,
        createdAt: donation.createdAt.toISOString(),
        completedAt: donation.completedAt ? donation.completedAt.toISOString() : null,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
