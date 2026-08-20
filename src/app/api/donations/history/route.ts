/**
 * GET /api/donations/history
 *
 * Returns the authenticated user's donation history with pagination + filters.
 *
 * SKELETON — full implementation arrives with payment-agent phase.
 */
import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  // TODO(payment-agent): implement
  // 1. requireAuth()
  // 2. validate query via donationHistoryQuerySchema
  // 3. prisma.donation.findMany with filters, pagination, orderBy
  // 4. count for total
  // 5. format Decimals as strings
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}
