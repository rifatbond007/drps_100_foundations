/**
 * POST /api/donations/create
 *
 * Creates a pending donation and initiates bKash payment.
 *
 * SKELETON — full implementation arrives with payment-agent phase.
 *
 * Role guard: admins (`role === 'ADMIN'`) are forbidden from donating.
 * This is enforced server-side so a crafted request from an admin
 * account can't bypass the UI's client-side redirect.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth/next-auth';

export async function POST(_request: NextRequest) {
  // 0. Role guard — must come before any side-effects. Cheap, no DB hit.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED', message: 'Sign in to donate' },
      { status: 401 }
    );
  }
  if (session.user.role === 'ADMIN') {
    return NextResponse.json(
      {
        success: false,
        error: 'FORBIDDEN',
        message: 'Admins cannot donate. Sign in with a regular user account to contribute.',
      },
      { status: 403 }
    );
  }

  // TODO(payment-agent): implement
  // 1. rateLimit per user
  // 2. validate input via createDonationSchema
  // 3. ban + profileCompleted checks
  // 4. idempotency check (Redis)
  // 5. prisma.donation.create({ status: PENDING })
  // 6. bkashClient.createPayment(...)
  // 7. update donation with bkashPaymentId
  // 8. cache idempotency response
  // 9. audit log
  return NextResponse.json(
    {
      success: false,
      error: 'NOT_IMPLEMENTED',
      message: 'Donation create arrives with payment-agent phase',
    },
    { status: 501 }
  );
}
