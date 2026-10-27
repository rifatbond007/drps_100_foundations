-- One active donation per bKash TrxID. FAILED/CANCELLED rows are excluded
-- so a donor can resubmit a TrxID after an admin rejected it.
-- Prisma can't express partial indexes; this lives in raw SQL only.
-- Run `pnpm db:check-duplicate-trx` before deploying: this fails if
-- duplicates already exist.
CREATE UNIQUE INDEX "Donation_trxId_active_key"
  ON "Donation" ("trxId")
  WHERE "trxId" IS NOT NULL AND "status" NOT IN ('FAILED', 'CANCELLED');
