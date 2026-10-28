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
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { ok, fail, parseJsonBody } from '@/lib/api/helpers';
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
    const body = await parseJsonBody(request, createDonationSchema);

    // 5. Idempotency (response cache). If Redis is unreachable we
    // proceed without the cache — a retried POST would create a second
    // PENDING row (visible to admin + donor in history), but refusing
    // every donation when Redis is down is worse for donors. The
    // warning is loud enough for ops to notice.
    // Scoped by user so one donor's key can never replay another's response.
    const idemKey = `idem:donation:${session.user.id}:${body.idempotencyKey}`;
    let cached: string | null = null;
    try {
      cached = await redis.get(idemKey);
    } catch (error) {
      logger.warn(
        {
          err: error instanceof Error ? error.message : String(error),
          idempotencyKey: body.idempotencyKey,
        },
        'donations.create: idempotency cache unavailable, proceeding without dedupe'
      );
    }
    if (cached) {
      // Replay the cached response verbatim — guarantees an idempotent
      // retry from the UI doesn't double-charge.
      return NextResponse.json(JSON.parse(cached));
    }

    // 6. Insert Donation(PENDING). No gateway call — manual flow means
    //    the donor sends money out-of-band and submits the TrxID next.
    // bkashPaymentId mirrors the donation id so the column is non-null.
    // Create + update run in one transaction so a failure can't leave a
    // row without its payment id.
    const donation = await prisma.$transaction(async (tx) => {
      const created = await tx.donation.create({
        data: {
          userId: session.user.id,
          amount: body.amount.toString(),
          currency: 'BDT',
          purpose: body.purpose,
          isAnonymous: body.isAnonymous,
          status: 'PENDING',
          paymentMethod: PAYMENT_METHOD,
        },
      });
      return tx.donation.update({
        where: { id: created.id },
        data: { bkashPaymentId: created.id },
      });
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

    await redis
      .set(idemKey, JSON.stringify(responseBody), 'EX', IDEMPOTENCY_TTL_SECONDS)
      .catch((error) => {
        // Cache-write failure is non-fatal — the donation is already
        // persisted. We just lose dedupe for any retries of this exact
        // idempotencyKey. Log loudly so ops can spot Redis outages.
        logger.warn(
          {
            err: error instanceof Error ? error.message : String(error),
            idempotencyKey: body.idempotencyKey,
          },
          'donations.create: idempotency cache write failed'
        );
      });

    return ok(responseBody.data);
  } catch (error) {
    logger.error({ error }, 'donations.create failed');
    return fail(error, { route: 'donations/create', method: 'POST' });
  }
}
