# Production diagnostics — Sept 2, 2026 outage

Three routes return opaque 500s in production:

1. `GET /api/users/profile` → dashboard "Recent donations" fails.
2. `POST /api/donations/create` → donate submit button fails.
3. `GET /api/donations/history` → history page fails.

This file gives you the exact `psql` queries to confirm the cause and verify the fix. Run them against the **production Neon** database (not the local dev one).

## How to connect

```bash
# Option A — Neon SQL editor (no local psql needed):
#   1. Open https://console.neon.tech → project → SQL Editor
#   2. Paste each query below; capture the output
#   3. Paste the output back to the assistant for diagnosis

# Option B — local psql with the prod DATABASE_URL:
psql "$DATABASE_URL"   # DATABASE_URL is the Neon connection string from .env.local
```

**DO NOT** run any of the UPDATE/INSERT/DELETE queries at the bottom of this file unless the assistant explicitly tells you to. The SELECTs are safe.

---

## Diagnostic queries

### Q1 — Confirm the error rows landed in AuditLog (proves the ref UUIDs are valid)

```sql
SELECT
    "id",
    "action",
    "severity",
    "correlationId",
    "resource",
    "details"->>'errorName'    AS error_name,
    "details"->>'errorMessage' AS error_message,
    LEFT("details"->>'stack', 500) AS stack_top_500,
    "createdAt"
FROM "AuditLog"
WHERE "correlationId" IN (
    'eb0ec14c-eef4-4443-88d1-666a0bb0ca38',
    '5e69f83b-c292-4fc2-92c2-ccbb73e3d7ce',
    'd6a444c2-bd4e-48b7-8c66-2539601fcd1c'
)
ORDER BY "createdAt" DESC;
```

**Expected outcomes:**

- **Three rows returned, each in `details->>errorMessage` shows `column "trxId" does not exist` (or similar)** → Cause #1 (schema drift) is confirmed; `REDIS_URL` was NOT the only issue.
- **Three rows returned, each showing `REDIS_URL must be set in production` (or similar connection error)** → Cause #2 (REDIS_URL) is the only issue; once you set it on Vercel, the routes will work even without any migration.
- **Both error shapes appear** → both causes are real and both fixes are needed.
- **Zero rows returned** → `persistError()` itself failed (likely because `AuditLog.correlationId` or `AuditLog.severity` columns are missing in prod). Skip to Q3.

### Q2 — Confirm the manual bKash columns exist on `Donation` (Cause #1 check)

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'Donation'
  AND column_name IN (
    'trxId',
    'senderPhone',
    'trxSubmittedAt',
    'reviewedById',
    'reviewedAt',
    'adminNote'
)
ORDER BY column_name;
```

**Expected outcomes:**

- **6 rows** → all manual bKash columns are present. Cause #1 is unlikely — the problem is `REDIS_URL`.
- **0–5 rows** → drift confirmed. The 20260902120000_init migration needs to run on prod.

### Q3 — Confirm the AuditLog columns exist (proves Cause #1 isn't masking itself)

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'AuditLog'
  AND column_name IN ('severity', 'correlationId')
ORDER BY column_name;
```

**Expected outcomes:**

- **2 rows** → AuditLog is up-to-date.
- **0–1 rows** → both `persistError()` and `Donation` reads are broken in prod.

### Q4 — Confirm the Prisma migrations state in prod

```sql
SELECT
    migration_name,
    finished_at IS NOT NULL AS finished,
    started_at
FROM _prisma_migrations
ORDER BY started_at;
```

**Expected outcomes:**

- **Empty result** → prod was bootstrapped via `prisma db push`, not via migrations. The `20260902120000_init` migration will run idempotently on first `pnpm db:deploy`.
- **Some rows but none matching `20260902120000_init`** → similar to above; prod has older migrations that no longer match HEAD. The new init migration will run additively.
- **A row for `20260902120000_init`** → already deployed (fix is in).

### Q5 — Test the connection-list of tables present in prod

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type   = 'BASE TABLE'
ORDER BY table_name;
```

**Expected outcomes:**

- A list of tables present in prod. Compare against the schema: `Account`, `Session`, `VerificationToken`, `User`, `Donation`, `AuditLog`, `UserSettings`. (The `_prisma_migrations` table may or may not be there — Q4 covers that.) Any extras (e.g. `Campaign`, `IdempotencyKey`) are leftovers from the removed `d3b8f82` migration — harmless.

---

## After the fix — verify

Once you (or the assistant) have applied the migration + set the env vars + redeployed on Vercel, re-run Q1–Q4 against prod:

```sql
-- Q1 (with the new errorIds you'll have, if any):
SELECT "correlationId", "details"->>'errorMessage' FROM "AuditLog"
WHERE "action" = 'API_UNHANDLED_ERROR'
ORDER BY "createdAt" DESC LIMIT 5;
```

Should return **no rows** that match the new error shapes (any unrelated historical rows are fine).

```sql
-- Q2 should now return 6 rows.
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'Donation'
  AND column_name IN ('trxId','senderPhone','trxSubmittedAt','reviewedById','reviewedAt','adminNote');

-- Q4 should now include 20260902120000_init.
SELECT migration_name FROM _prisma_migrations ORDER BY started_at;
```

---

## What to paste back

Paste the **raw output** of Q1 (most important), Q2, Q3, Q4 into the chat so the assistant can confirm the cause and check off the checklist. The assistant will tell you whether the fix is "set REDIS_URL only", "apply migration only", or "both".
