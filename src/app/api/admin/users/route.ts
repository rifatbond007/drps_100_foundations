/**
 * GET /api/admin/users — list users (paginated, searchable)
 * POST /api/admin/users/[id]/ban — ban a user
 *
 * SKELETON.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
}
