/**
 * POST /api/donations/create
 *
 * Creates a pending donation and initiates bKash payment.
 *
 * SKELETON — full implementation arrives with payment-agent phase.
 */
import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  // TODO(payment-agent): implement
  // 1. requireAuth()
  // 2. rateLimit per user
  // 3. validate input via createDonationSchema
  // 4. ban + profileCompleted checks
  // 5. idempotency check (Redis)
  // 6. prisma.donation.create({ status: PENDING })
  // 7. bkashClient.createPayment(...)
  // 8. update donation with bkashPaymentId
  // 9. cache idempotency response
  // 10. audit log
  return NextResponse.json(
    { success: false, error: 'NOT_IMPLEMENTED', message: 'Donation create arrives with payment-agent phase' },
    { status: 501 },
  );
}
