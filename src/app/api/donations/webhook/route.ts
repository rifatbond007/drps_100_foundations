/**
 * POST /api/donations/webhook
 *
 * bKash server-to-server notification.
 *
 * SKELETON — full implementation arrives with payment-agent phase.
 */
import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  // TODO(payment-agent): implement
  // 1. Read paymentID from body
  // 2. CRITICAL: verify via Query API
  // 3. Idempotency (already SUCCESS → noop)
  // 4. Update donation + org
  // 5. Return 200 { received: true }
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}
