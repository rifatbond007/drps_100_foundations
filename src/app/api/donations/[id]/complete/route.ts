/**
 * POST /api/donations/[id]/complete
 *
 * Called by the in-app dummy checkout (/donate/checkout) when the user
 * clicks Pay or Cancel. Updates the donation's status and transaction
 * fields, then returns the URL the client should navigate to.
 *
 * This route is auth-protected and the (id) must belong to the calling
 * user — we never let one user complete another user's donation.
 *
 * In the real (bKash) flow this endpoint doesn't exist; the payment
 * provider redirects to /api/donations/callback instead.
 */
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { logSecurityEvent } from '@/lib/audit';
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors';

const completeSchema = z.object({
  status: z.enum(['SUCCESS', 'FAILED', 'CANCELLED']),
  failureReason: z.string().max(200).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveUser();
    const { id } = await params;

    if (!id || typeof id !== 'string' || id.length > 64) {
      throw new ValidationError('Invalid donation id');
    }

    let body: z.infer<typeof completeSchema>;
    try {
      body = completeSchema.parse(await request.json());
    } catch (error) {
      if (error instanceof z.ZodError) return fail(error);
      throw error;
    }

    const donation = await prisma.donation.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        amount: true,
        currency: true,
        purpose: true,
      },
    });

    if (!donation) throw new NotFoundError('Donation not found');
    // userId is nullable on the schema (soft-delete SetNull) — guard both.
    if (!donation.userId || donation.userId !== session.user.id) {
      throw new ForbiddenError('You cannot modify this donation');
    }

    // Idempotent: if already in a terminal state, just echo it back.
    // This means a retry from the dummy checkout (e.g. user hits back
    // then forward) doesn't double-mark.
    if (donation.status === 'SUCCESS') {
      return ok({ donationId: donation.id, status: donation.status });
    }
    if (donation.status === 'FAILED' || donation.status === 'CANCELLED') {
      return ok({ donationId: donation.id, status: donation.status });
    }

    const trxId =
      body.status === 'SUCCESS'
        ? `DUMMY-TRX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        : null;

    const updated = await prisma.donation.update({
      where: { id },
      data: {
        status: body.status,
        failureReason: body.status === 'SUCCESS' ? null : (body.failureReason ?? 'user_cancelled'),
        bkashTransactionId: trxId,
        completedAt: new Date(),
      },
    });

    await logSecurityEvent({
      action: body.status === 'SUCCESS' ? 'DONATION_COMPLETED' : 'DONATION_FAILED',
      userId: session.user.id,
      details: {
        donationId: updated.id,
        amount: updated.amount.toString(),
        purpose: updated.purpose,
      },
    });

    return ok({
      donationId: updated.id,
      status: updated.status,
      redirectUrl:
        body.status === 'SUCCESS'
          ? `/${session.user.languagePref === 'EN' ? 'en' : 'bn'}/donate/success?id=${updated.id}`
          : `/${session.user.languagePref === 'EN' ? 'en' : 'bn'}/donate/failed?id=${updated.id}`,
    });
  } catch (error) {
    return fail(error);
  }
}
