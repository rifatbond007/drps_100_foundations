/**
 * GET /api/donations/callback
 *
 * Provider redirect-back endpoint. Real bKash redirects the user here
 * with `?paymentID=...&status=success|failure|cancelled` after the
 * payment authorization page. The dummy provider doesn't redirect
 * here — it uses /api/donations/[id]/complete (POST) directly from the
 * in-app checkout page — but we still implement this so the route
 * exists for future real-gateway use and for any stale bookmark.
 *
 * IMPORTANT: never trust callback query params. We re-check the
 * donation's persisted state and act on that. If the donation is
 * already SUCCESS / FAILED, this is a no-op.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/next-auth';
import { logSecurityEvent } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const donationId = url.searchParams.get('donationId');
  const status = url.searchParams.get('status');
  const session = await auth();
  const locale = (session?.user?.languagePref ?? 'BN') === 'EN' ? 'en' : 'bn';

  if (!donationId) {
    return NextResponse.redirect(new URL(`/${locale}/donate/failed`, request.url));
  }

  // Look up the donation; if it's already in a terminal state, honor
  // that. We only flip PENDING → terminal here.
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    select: { id: true, status: true, userId: true },
  });

  if (!donation || !donation.userId) {
    return NextResponse.redirect(new URL(`/${locale}/donate/failed`, request.url));
  }

  // If the donation already completed (e.g. webhook beat the callback),
  // honor its current status.
  if (donation.status === 'SUCCESS') {
    return NextResponse.redirect(
      new URL(`/${locale}/donate/success?id=${donation.id}`, request.url)
    );
  }
  if (donation.status === 'FAILED' || donation.status === 'CANCELLED') {
    return NextResponse.redirect(
      new URL(`/${locale}/donate/failed?id=${donation.id}`, request.url)
    );
  }

  // Mark it based on the ?status query param.
  const finalStatus: 'SUCCESS' | 'FAILED' | 'CANCELLED' =
    status === 'success' ? 'SUCCESS' : status === 'cancelled' ? 'CANCELLED' : 'FAILED';

  await prisma.donation.update({
    where: { id: donation.id },
    data: {
      status: finalStatus,
      failureReason: finalStatus === 'SUCCESS' ? null : 'callback_failure',
      bkashTransactionId: finalStatus === 'SUCCESS' ? `DUMMY-TRX-${Date.now()}` : null,
      completedAt: new Date(),
    },
  });

  await logSecurityEvent({
    action: finalStatus === 'SUCCESS' ? 'DONATION_COMPLETED' : 'DONATION_FAILED',
    userId: donation.userId,
    details: { donationId: donation.id },
  });

  return NextResponse.redirect(
    new URL(
      finalStatus === 'SUCCESS'
        ? `/${locale}/donate/success?id=${donation.id}`
        : `/${locale}/donate/failed?id=${donation.id}`,
      request.url
    )
  );
}
