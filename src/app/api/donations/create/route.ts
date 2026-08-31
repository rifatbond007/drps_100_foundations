/**
 * POST /api/donations/create
 *
 * Creates a PENDING donation. The donor will then send money to the
 * foundation's personal bKash number (BKASH_RECEIVER_NUMBER) and submit
 * the TrxID through /donate/submit, which calls /api/donations/[id]/
 * submit-trx to attach the TrxID. An admin reviews + approves from
 * /admin/donations.
 *
 * Flow:
 *   1. requireActiveUser (auth + ban + soft-delete checks)
 *   2. Role guard — admins cannot donate
 *   3. Rate-limit per user (RATE_LIMITS.DONATION_CREATE: 3 / 5 min)
 *   4. Zod-validate body
 *   5. Idempotency check via Redis keyed on `idempotencyKey`
 *   6. Insert Donation(PENDING) with paymentMethod = "manual_bkash"
 *   7. Cache the idempotency response so a retry returns the same body
 *   8. Audit log DONATION_INITIATED
 *   9. Return { donationId, paymentMethod, nextStep: "submit-trx" }
 *
 * Profile completion is intentionally NOT required here — users may
 * donate without finishing onboarding and edit their profile from
 * /settings at any time.
 */
import { z } from 'zod';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { redis } from '@/lib/redis';
import { logSecurityEvent } from '@/lib/audit';
import { createDonationSchema } from '@/lib/validation/donation';
import { logger } from '@/lib/logger';
import { PAYMENT_METHOD } from '@/lib/payment';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24h

export async function POST(request: NextRequest) {
  try {
    // 1. Auth + ban + soft-delete
    const session = await requireActiveUser();

    // 2. Role guard — admins cannot donate (UX is /donate redirects them
    //    too; this is defense in depth).
    if (session.user.role === 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Admins cannot donate',
        },
        { status: 403 }
      );
    }

    // 3. Rate limit per user
    const rl = await rateLimit(
      `donation:create:${session.user.id}`,
      RATE_LIMITS.DONATION_CREATE.max,
      RATE_LIMITS.DONATION_CREATE.windowSeconds
    );
    requireRateLimit(rl);

    // 4. Zod-validate body
    let body: z.infer<typeof createDonationSchema>;
    try {
      body = createDonationSchema.parse(await request.json());
    } catch (error) {
      if (error instanceof z.ZodError) return fail(error);
      throw error;
    }

    // 5. Idempotency (response cache)
    const cached = await redis.get(`idem:donation:${body.idempotencyKey}`);
    if (cached) {
      // Replay the cached response verbatim — guarantees an idempotent
      // retry from the UI doesn't double-charge.
      return NextResponse.json(JSON.parse(cached));
    }

    // 6. Insert Donation(PENDING). No gateway call — manual flow means
    //    the donor sends money out-of-band and submits the TrxID next.
    const donation = await prisma.donation.create({
      data: {
        userId: session.user.id,
        amount: body.amount.toString(),
        currency: 'BDT',
        purpose: body.purpose,
        isAnonymous: body.isAnonymous,
        status: 'PENDING',
        // Use the donation id itself as the "payment id" so the field is
        // non-null from the start. The bkashTransactionId field will be
        // populated later (by /submit-trx for the donor's submitted
        // TrxID, then promoted to the real TrxID on admin approval).
        bkashPaymentId: undefined, // will be set below
        paymentMethod: PAYMENT_METHOD,
      },
    });

    // Persist paymentId = donationId for stable lookup. Use update so the
    // @unique constraint on bkashPaymentId applies and we surface any
    // collision (extremely unlikely with cuid() but defensive).
    await prisma.donation.update({
      where: { id: donation.id },
      data: { bkashPaymentId: donation.id },
    });

    // 7. Audit + idempotency cache
    await logSecurityEvent({
      action: 'DONATION_INITIATED',
      userId: session.user.id,
      details: {
        donationId: donation.id,
        amount: donation.amount.toString(),
        purpose: donation.purpose,
        paymentMethod: PAYMENT_METHOD,
      },
    });

    const responseBody = {
      success: true,
      data: {
        donationId: donation.id,
        paymentMethod: PAYMENT_METHOD,
        // Hint to the client — there's no automatic redirect anymore.
        // The donate page will route the donor to /donate/submit?id=...
        // to collect TrxID + sender phone.
        nextStep: 'submit-trx' as const,
      },
    };

    await redis.set(
      `idem:donation:${body.idempotencyKey}`,
      JSON.stringify(responseBody),
      'EX',
      IDEMPOTENCY_TTL_SECONDS
    );

    return ok(responseBody.data);
  } catch (error) {
    logger.error({ error }, 'donations.create failed');
    return fail(error);
  }
}
