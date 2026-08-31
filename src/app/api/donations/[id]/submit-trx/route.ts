/**
 * POST /api/donations/[id]/submit-trx
 *
 * Donor submits the bKash TrxID + sender phone AFTER sending money to
 * the foundation's personal bKash number (BKASH_RECEIVER_NUMBER). The
 * donation stays PENDING until an admin approves it from
 * /admin/donations.
 *
 * Rules:
 *   - The donation must belong to the calling user (defense in depth
 *     alongside requireActiveUser).
 *   - The donation must currently be in PENDING (or PENDING_TRX) and
 *     must NOT have a TrxID yet — re-submitting would let a user swap
 *     their TrxID after admin review began.
 *   - The TrxID is globally unique across donations (schema @unique) so
 *     a single bKash transaction cannot be claimed twice.
 *
 * After accepting the TrxID the donor is redirected to
 * /donate/pending?id=... which shows the receipt number + the
 * estimated review window.
 */
import { z } from 'zod';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { logSecurityEvent } from '@/lib/audit';
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors';
import { submitTrxSchema } from '@/lib/validation/donation';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireActiveUser();
    const { id } = await params;

    if (!id || typeof id !== 'string' || id.length > 64) {
      throw new ValidationError('Invalid donation id');
    }

    let body: z.infer<typeof submitTrxSchema>;
    try {
      body = submitTrxSchema.parse(await request.json());
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
        trxId: true,
        senderPhone: true,
        bkashTransactionId: true,
      },
    });

    if (!donation) throw new NotFoundError('Donation not found');
    if (!donation.userId || donation.userId !== session.user.id) {
      throw new ForbiddenError('You cannot modify this donation');
    }

    // Block re-submission once the donation has any of:
    //   - a user-submitted TrxID (donor already submitted)
    //   - an admin-recorded bkashTransactionId (admin already approved)
    //   - a terminal status (SUCCESS/FAILED/CANCELLED)
    if (donation.trxId || donation.bkashTransactionId) {
      throw new ValidationError('TrxID already submitted for this donation');
    }
    if (donation.status !== 'PENDING') {
      throw new ValidationError(`Donation is ${donation.status} — cannot submit TrxID`);
    }

    // Pre-check TrxID uniqueness. The schema also has @unique so this is
    // a friendly error path; the DB constraint is the real guard.
    const existingTrx = await prisma.donation.findFirst({
      where: { trxId: body.trxId },
      select: { id: true },
    });
    if (existingTrx && existingTrx.id !== id) {
      throw new ValidationError('This TrxID is already associated with another donation');
    }

    const updated = await prisma.donation.update({
      where: { id },
      data: {
        trxId: body.trxId,
        senderPhone: body.senderPhone,
        trxSubmittedAt: new Date(),
      },
      select: { id: true, status: true, trxId: true, senderPhone: true },
    });

    await logSecurityEvent({
      action: 'DONATION_TRX_SUBMITTED',
      userId: session.user.id,
      details: {
        donationId: updated.id,
        // TrxID itself is sensitive enough that we log a prefix only,
        // so the audit log doesn't become a TrxID database.
        trxIdPrefix: updated.trxId?.slice(0, 4),
        senderPhoneSuffix: updated.senderPhone?.slice(-4),
      },
    });

    return ok({
      donationId: updated.id,
      status: updated.status,
      trxId: updated.trxId,
      senderPhone: updated.senderPhone,
      redirectUrl: `/${session.user.languagePref === 'EN' ? 'en' : 'bn'}/donate/pending?id=${updated.id}`,
    });
  } catch (error) {
    return fail(error);
  }
}
