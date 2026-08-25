/**
 * GET /api/donations/callback
 *
 * bKash redirects the user here after payment approval.
 *
 * SKELETON — full implementation arrives with payment-agent phase.
 */
import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  // TODO(payment-agent): implement
  // 1. Read paymentID from query
  // 2. CRITICAL: bkashClient.queryPayment(paymentID) — never trust callback
  // 3. Find donation by bkashPaymentId
  // 4. Update status (SUCCESS/FAILED) + bkashTransactionId
  // 5. On success: update org raisedAmount
  // 6. Audit log
  // 7. Redirect to /donate/success or /donate/failed
  return NextResponse.json(
    {
      success: false,
      error: 'NOT_IMPLEMENTED',
      message: 'Callback handler arrives with payment-agent phase',
    },
    { status: 501 }
  );
}
