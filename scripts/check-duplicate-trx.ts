/**
 * Pre-deploy check for the "Donation_trxId_active_key" partial unique index.
 *
 * Lists every TrxID shared by more than one active donation (status not
 * FAILED/CANCELLED). Exits 1 when any exist so the migration is not
 * deployed until an admin resolves them. Never modifies data.
 *
 * Usage: pnpm db:check-duplicate-trx
 */
import { PrismaClient } from '@prisma/client';

export interface TrxRow {
  id: string;
  trxId: string;
  status: string;
  userId: string | null;
  createdAt: Date;
}

const INACTIVE = new Set(['FAILED', 'CANCELLED']);

export function groupDuplicateTrx(rows: TrxRow[]): Record<string, TrxRow[]> {
  const byTrx: Record<string, TrxRow[]> = {};
  for (const row of rows) {
    if (INACTIVE.has(row.status)) continue;
    (byTrx[row.trxId] ??= []).push(row);
  }
  return Object.fromEntries(Object.entries(byTrx).filter(([, group]) => group.length > 1));
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.donation.findMany({
      where: { trxId: { not: null } },
      select: { id: true, trxId: true, status: true, userId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const groups = groupDuplicateTrx(rows as TrxRow[]);
    const entries = Object.entries(groups);
    if (entries.length === 0) {
      console.log('No duplicate active TrxIDs. Safe to deploy the migration.');
      return;
    }
    console.error(`Found ${entries.length} TrxID(s) used by more than one active donation:`);
    for (const [trxId, group] of entries) {
      console.error(`\n${trxId}`);
      for (const r of group) {
        console.error(
          `  ${r.id}  ${r.status}  user=${r.userId ?? '-'}  ${r.createdAt.toISOString()}`
        );
      }
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith('check-duplicate-trx.ts')) {
  void main();
}
