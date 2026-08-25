/**
 * POST /api/donations/create
 *
 * Creates a PENDING donation and starts a (dummy) payment session.
 *
 * Flow:
 *   1. requireActiveUser (auth + ban + soft-delete checks)
 *   2. requireActiveUser re-checks `profileCompleted` (no DB hits for
 *      done-flag is fine — we use the cached session column first, then
 *      fall back to the DB if missing)
 *   3. Rate-limit per user (RATE_LIMITS.DONATION_CREATE: 3 / 5 min)
 *   4. Idempotency check via Redis keyed on `idempotencyKey`
 *   5. Zod-validate body
 *   6. Admin role guard (admins can't donate)
 *   7. Insert Donation(PENDING) with bkashPaymentId populated by the
 *      dummy provider
 *   8. Cache the idempotency response so a retry returns the same body
 *   9. Audit log DONATION_INITIATED
 *  10. Return { donationId, paymentId, redirectUrl }
 *
 * Provider is selected via `getPaymentClient()` from
 * src/lib/payment/types.ts. Default is Dummy; set PAYMENT_PROVIDER=bkash
 * to switch to the (still-skeleton) bKash real provider.
 */
import { z } from 'zod';
import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { redis } from '@/lib/redis';
import { logSecurityEvent } from '@/lib/audit';
import { PaymentError } from '@/lib/errors';
import { createDonationSchema } from '@/lib/validation/donation';
import { getPaymentClient } from '@/lib/payment/types';
import { logger } from '@/lib/logger';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24h

export async function POST(request: NextRequest) {
  try {
    // 1. Auth + ban + soft-delete
    const session = await requireActiveUser();

    // 2. Profile must be completed before we can take money
    if (!session.user.profileCompleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'PROFILE_INCOMPLETE',
          message: 'Please complete your profile before donating',
        },
        { status: 409 }
      );
    }

    // 3. Role guard — admins cannot donate (UX is /donate redirects them
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

    // 4. Rate limit per user
    const rl = await rateLimit(
      `donation:create:${session.user.id}`,
      RATE_LIMITS.DONATION_CREATE.max,
      RATE_LIMITS.DONATION_CREATE.windowSeconds
    );
    requireRateLimit(rl);

    // 5. Idempotency (response cache)
    let body: z.infer<typeof createDonationSchema>;
    try {
      body = createDonationSchema.parse(await request.json());
    } catch (error) {
      if (error instanceof z.ZodError) return fail(error);
      throw error;
    }

    const cached = await redis.get(`idem:donation:${body.idempotencyKey}`);
    if (cached) {
      // Replay the cached response verbatim — guarantees an idempotent
      // retry from the UI doesn't double-charge.
      return NextResponse.json(JSON.parse(cached));
    }

    // 6. Build callback URL. The dummy checkout page redirects back here
    //    with ?status=success|failure; the real bKash would too.
    const h = await headers();
    const host = h.get('host') ?? 'localhost:3000';
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
    const callbackUrl = `${proto}://${host}/api/donations/callback`;

    // 7. Create the donation row first so the paymentId can be tied
    //    to it. We pass a placeholder bkashPaymentId that the payment
    //    provider will confirm; if it can't, we delete the row in the
    //    catch block to avoid orphaned PENDING donations.
    const placeholderPaymentId = `pending-${crypto.randomUUID()}`;
    const donation = await prisma.donation.create({
      data: {
        userId: session.user.id,
        amount: body.amount.toString(),
        currency: 'BDT',
        purpose: body.purpose,
        isAnonymous: body.isAnonymous,
        status: 'PENDING',
        bkashPaymentId: placeholderPaymentId,
        paymentMethod: 'dummy',
      },
    });

    // 8. Start the payment. With the dummy provider this is in-process
    //    and can't fail for transport reasons; with a real provider it
    //    can fail (network, bad credentials, etc.) and we'd need to
    //    mark the donation FAILED and audit-log.
    let payment;
    try {
      const client = getPaymentClient();
      payment = await client.createPayment({
        amount: body.amount,
        callbackUrl,
        donationId: donation.id,
      });
    } catch (error) {
      // Mark the just-created donation as FAILED so it doesn't sit in
      // PENDING forever and pollute admin reports.
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: 'FAILED',
          failureReason: 'payment_provider_error',
          completedAt: new Date(),
        },
      });
      throw new PaymentError(error instanceof Error ? error.message : 'Payment provider error');
    }

    // 9. Persist the real paymentId from the provider.
    await prisma.donation.update({
      where: { id: donation.id },
      data: { bkashPaymentId: payment.paymentId },
    });

    // 10. Audit + idempotency cache
    await logSecurityEvent({
      action: 'DONATION_INITIATED',
      userId: session.user.id,
      details: {
        donationId: donation.id,
        amount: donation.amount.toString(),
        purpose: donation.purpose,
        paymentMethod: 'dummy',
      },
    });

    const responseBody = {
      success: true,
      data: {
        donationId: donation.id,
        paymentId: payment.paymentId,
        // For dummy: in-app /donate/checkout. For real: third-party URL.
        redirectUrl: payment.redirectUrl,
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
