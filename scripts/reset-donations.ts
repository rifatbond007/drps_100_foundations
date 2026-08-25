/**
 * Reset donation test data.
 *
 * Wipes:
 *   - Donation table (all rows)
 *   - AuditLog rows scoped to donation activity
 *     (DONATION_INITIATED, DONATION_COMPLETED, DONATION_FAILED)
 *   - Redis idempotency keys (idem:donation:*)
 *   - Redis rate-limit keys (ratelimit:donation:create:*)
 *
 * Preserves:
 *   - User rows (so admins and signed-up users can still sign in)
 *   - UserSettings, Account, Session rows
 *   - AuditLog rows that are NOT donation-related
 *     (USER_LOGIN, USER_LOGOUT, USER_REGISTERED, USER_PROMOTED_TO_ADMIN,
 *      PROFILE_UPDATED, SETTINGS_UPDATED, BAN/UNBAN/PROMOTE, etc.)
 *
 * Intended for the dummy payment flow in dev. The user wants a fresh
 * slate so when a new user signs in they see "everything 0", and any
 * donation they then make shows up live in both the user dashboard
 * and the admin reports panel.
 *
 * Usage:
 *   pnpm tsx scripts/reset-donations.ts
 *
 * Idempotent — safe to re-run.
 */
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const DONATION_AUDIT_ACTIONS = ['DONATION_INITIATED', 'DONATION_COMPLETED', 'DONATION_FAILED'];

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6380', {
    maxRetriesPerRequest: 3,
  });

  console.log('→ Connecting to Postgres…');
  await prisma.$connect();
  // Expose for the .finally() cleanup below — TypeScript scopes them
  // to main() otherwise and the process won't disconnect cleanly.
  (globalThis as { __resetPrisma?: PrismaClient; __resetRedis?: Redis }).__resetPrisma = prisma;
  (globalThis as { __resetPrisma?: PrismaClient; __resetRedis?: Redis }).__resetRedis = redis;

  console.log('→ Snapshotting pre-reset counts…');
  const [donationsBefore, donationAuditBefore, usersBefore] = await Promise.all([
    prisma.donation.count(),
    prisma.auditLog.count({ where: { action: { in: DONATION_AUDIT_ACTIONS } } }),
    prisma.user.count(),
  ]);
  console.log(
    `  ${donationsBefore} donations, ${donationAuditBefore} donation audit rows, ${usersBefore} users preserved`
  );

  // 1. Donations — delete in FK-safe order. Donation.userId is SetNull
  //    on cascade (preserves the financial record if the user is hard-
  //    deleted). We want a hard wipe, so we just delete the rows.
  console.log('→ Deleting all Donation rows…');
  const deletedDonations = await prisma.donation.deleteMany({});

  // 2. Donation-related audit logs. Non-donation audit rows are kept
  //    so the security trail of who signed in / got banned / got
  //    promoted remains intact.
  console.log('→ Deleting donation-related AuditLog rows…');
  const deletedAudit = await prisma.auditLog.deleteMany({
    where: { action: { in: DONATION_AUDIT_ACTIONS } },
  });

  // 3. Redis caches. SCAN avoids blocking on large keyspaces.
  console.log('→ Flushing donation idempotency keys (idem:donation:*)…');
  const idemKeys = await scanKeys(redis, 'idem:donation:*');
  if (idemKeys.length > 0) {
    await redis.del(...idemKeys);
  }

  console.log('→ Flushing donation rate-limit keys (ratelimit:donation:create:*)…');
  const rlKeys = await scanKeys(redis, 'ratelimit:donation:create:*');
  if (rlKeys.length > 0) {
    await redis.del(...rlKeys);
  }

  console.log('→ Snapshotting post-reset counts…');
  const [donationsAfter, donationAuditAfter, usersAfter] = await Promise.all([
    prisma.donation.count(),
    prisma.auditLog.count({ where: { action: { in: DONATION_AUDIT_ACTIONS } } }),
    prisma.user.count(),
  ]);

  console.log('');
  console.log('✅ Reset complete:');
  console.log(
    `   donations:        ${donationsBefore} → ${donationsAfter}  (${deletedDonations.count} deleted)`
  );
  console.log(
    `   donation audit:   ${donationAuditBefore} → ${donationAuditAfter}  (${deletedAudit.count} deleted)`
  );
  console.log(`   idem cache keys:  ${idemKeys.length} deleted`);
  console.log(`   rate-limit keys:  ${rlKeys.length} deleted`);
  console.log(`   users preserved:  ${usersBefore} → ${usersAfter}`);
  console.log('');
  console.log('Tip: any active JWT sessions are still valid; users just see');
  console.log('     fresh dashboards the next time they load /dashboard or');
  console.log('     /admin/reports.');
}

async function scanKeys(redis: Redis, pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
    cursor = next;
    keys.push(...batch);
  } while (cursor !== '0');
  return keys;
}

main()
  .catch((e) => {
    console.error('❌ Reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    const p = (globalThis as { __resetPrisma?: PrismaClient; __resetRedis?: Redis }).__resetPrisma;
    const r = (globalThis as { __resetPrisma?: PrismaClient; __resetRedis?: Redis }).__resetRedis;
    if (p) await p.$disconnect();
    if (r) {
      try {
        await r.quit();
      } catch {
        r.disconnect();
      }
    }
    // Force-exit so ioredis's keepalive timer can't keep the loop
    // alive past the .finally() block on dev machines.
    process.exit(0);
  });
