# UI Redesign + Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the audited bugs, clean the folder structure, and rebuild every page on a new warm/modern design system.

**Architecture:** Phase 1 hardens the server (API helpers, donation integrity, auth routing, public stats) and restructures non-UI folders. Phase 2 builds a new design system in `src/components/ui` + `src/components/layout`, then rebuilds each page using feature components under `src/features/*`, deleting the old component for that page in the same task. Phase 3 verifies (build, E2E, screenshots) and opens the PR.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind 3 + tailwindcss-animate, Radix UI, lucide-react, next-intl 3 (bn default, en), NextAuth v5 beta.25, Prisma 6 / Postgres, ioredis, TanStack Query 5, react-hook-form + zod, recharts, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-28-ui-redesign-and-cleanup-design.md`

## Global Constraints

- Route URLs never change (only route-group folder names: `(public)`→`(marketing)`, `(authenticated)`→`(app)`).
- Payment model unchanged: manual bKash Send Money + TrxID, admin approves. No PGW.
- bKash pink (`--bkash`, #E2136E) only on the pay/submit button and the bKash instruction card.
- No hardcoded "live" numbers anywhere; public figures come from `getPublicStats()`.
- Every user-facing string goes through `messages/bn.json` + `messages/en.json`; both files keep identical key sets.
- Bangla body text line-height ≥ 1.6; every page checked in `bn`.
- Component files kebab-case, PascalCase exports. Old components are deleted in the same task that replaces them.
- Font: Hind Siliguri only. Icons: lucide-react only.
- Respect `prefers-reduced-motion` for count-up / progress fill / hover lift.
- After every task: `pnpm type-check && pnpm lint && pnpm test` pass. Commit per task, Conventional Commits, each message ending with `Claude-Session: https://claude.ai/code/session_01QTPQ2aiqrLqKE3hSCmfaBo`.
- Branch: `feat/ui-redesign` (already created; deps installed; baseline 179 tests green).

## Review Focus

1. **Bad JSON/garbage query params on every mutating API route** → 400 `VALIDATION_ERROR`, never 500. Test owned by Task 3 (one test per route: create, submit-trx, approve, reject, admin/donations `?page=abc`).
2. **Two donors submit the same TrxID at once** → second gets 409 `TRX_ALREADY_USED`, not 500. Task 5 test simulates Prisma `P2002`.
3. **Admin approves while another admin rejects** → exactly one wins; the loser gets 409. Task 5 tests `updateMany` count 0 path for both routes.
4. **Stats unavailable (DB or Redis down) on the landing page** → page still renders, figures hidden (no zeros, no fake numbers). Task 13 test renders `HeroStats` with `stats={null}`.
5. **Signed-out user deep-links to `/en/donate?x=1`** → lands on `/en/login?callbackUrl=%2Fen%2Fdonate%3Fx%3D1`, and after sign-in returns there; an external `callbackUrl` is ignored. Task 8 tests `resolveRouteGuard` + `safeCallbackUrl` usage on login.

---

## Phase 1 — Cleanup & fixes

### Task 1: Remove dead code and unused dependencies

**Files:**

- Delete: `src/components/marketing/PublicNav.tsx`, `src/components/donation/DonationHistoryList.tsx`, `src/lib/i18n/utils.ts`, `src/lib/stores/auth-store.ts`, `src/components/ui/{avatar,separator,skeleton}.tsx`, `src/components/auth/LoginButton.tsx`, `src/components/auth/ProfileCompletionForm.tsx`, `src/app/api/users/complete-profile/route.ts`, `src/lib/validation/profile-completion.ts`
- Delete tests: `tests/auth/LoginButton.test.tsx`, `tests/auth/ProfileCompletionForm.test.tsx`, `tests/api/complete-profile.test.ts`, `tests/lib/validation-profile-completion.test.ts`
- Modify: `package.json` (remove `axios`, `date-fns`, `bcryptjs`, `zustand`, `@sentry/nextjs`, and `@types/bcryptjs` if present), `next.config.js` (drop Sentry/analyzer comment blocks and `date-fns` from `optimizePackageImports`), `src/lib/auth/session.ts` (drop `requireCompletedProfile` and the complete-profile doc comment if nothing imports it)

- [ ] **Step 1:** `grep -rn` each deleted module path across `src tests e2e` to confirm no remaining importer besides the deleted tests. Expected: no hits.
- [ ] **Step 2:** Delete files, `pnpm remove axios date-fns bcryptjs zustand @sentry/nextjs`.
- [ ] **Step 3:** Run `pnpm type-check && pnpm lint && pnpm test`. Expected: all pass (test count drops by the deleted files only).
- [ ] **Step 4:** Commit `chore: remove dead components, unused routes and dependencies`.

### Task 2: Consolidate shared utilities and formatting

**Files:**

- Create: `src/lib/utils/index.ts` (move `cn`, `truncate`, `sleep` from `src/lib/utils.ts`), `src/lib/format.ts`
- Delete: `src/lib/utils.ts` (import path `@/lib/utils` keeps resolving to the folder index)
- Modify: `src/lib/validation/common.ts` (export `BD_PHONE_REGEX = /^01[3-9]\d{8}$/`), `src/lib/validation/donation.ts`, `src/lib/validation/user.ts`, `src/app/api/users/profile/route.ts:24` (import the shared regex), `src/lib/api/helpers.ts` (import `ApiSuccess`/`ApiError` from `@/types/api`, delete local copies), every file with `locale === 'en' ? 'en-US' : 'bn-BD'` (use `format.ts`)
- Test: `tests/lib/format.test.ts`, update `tests/lib/utils.test.ts` imports

**Interfaces — Produces (`src/lib/format.ts`):**

- `type AppLocale = 'bn' | 'en'`
- `toAppLocale(locale: string): AppLocale` — `'en'` → `'en'`, anything else → `'bn'`
- `intlLocale(locale: AppLocale): 'bn-BD' | 'en-US'`
- `formatBDT(amount: number | string, locale: AppLocale): string` — moved from utils, same behaviour, `'—'` for non-finite
- `formatNumber(n: number, locale: AppLocale): string`
- `formatDate(date: Date | string, locale: AppLocale, opts?: Intl.DateTimeFormatOptions): string` — default `{ dateStyle: 'medium', timeZone: 'Asia/Dhaka' }`

- [ ] **Step 1: Write failing tests** in `tests/lib/format.test.ts`:
  - `formatBDT(1500, 'en')` contains `1,500`; `formatBDT(1500, 'bn')` contains `১,৫০০`; `formatBDT('abc','en') === '—'`
  - `formatNumber(1234, 'bn')` === `'১,২৩৪'`
  - `formatDate('2026-01-31T20:00:00Z', 'en')` contains `Feb 1, 2026` (Dhaka is UTC+6)
  - `toAppLocale('fr') === 'bn'`
- [ ] **Step 2:** `pnpm vitest run tests/lib/format.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement `format.ts`; move utils; swap regex + API types + locale ternaries (`grep -rn "'en-US' : 'bn-BD'\|bn-BD" src`).
- [ ] **Step 4:** `pnpm type-check && pnpm test` → PASS.
- [ ] **Step 5:** Commit `refactor: consolidate utils, formatting helpers and shared phone regex`.

### Task 3: API input parsing + error persistence

**Files:**

- Modify: `src/lib/api/helpers.ts`, `src/app/api/donations/create/route.ts`, `src/app/api/donations/[id]/submit-trx/route.ts`, `src/app/api/admin/donations/[id]/approve/route.ts`, `src/app/api/admin/donations/[id]/reject/route.ts`, `src/app/api/admin/donations/route.ts:30-40`, `src/app/api/auth/session/refresh/route.ts:49`, `src/app/api/users/profile/route.ts`, `src/app/api/users/settings/route.ts`
- Test: `tests/lib/api-helpers.test.ts` (new), extend existing `tests/api/*.test.ts`

**Interfaces — Produces (`src/lib/api/helpers.ts`):**

- `parseJsonBody<S extends z.ZodTypeAny>(request: Request, schema: S, opts?: { optional?: boolean }): Promise<z.infer<S>>` — empty body with `optional: true` parses `{}`; invalid JSON throws `ValidationError('Invalid JSON body')`; schema failure throws the `ZodError` (fail() already maps to 400).
- `parseQuery<S extends z.ZodTypeAny>(url: URL | string, schema: S): z.infer<S>` — `Object.fromEntries(searchParams)` through schema.
- `fail()` change: call `persistError` only when the status is ≥ 500 (unknown errors or `AppError` with `statusCode >= 500`). 4xx are logged at `warn`, not persisted.

- [ ] **Step 1: Write failing tests:**
  - `tests/lib/api-helpers.test.ts`: `parseJsonBody` on body `'{bad'` rejects with `ValidationError`; on `''` with `optional` returns `{}`; `fail(new NotFoundError())` with `NODE_ENV=production` does **not** call `prisma.auditLog.create`; `fail(new Error('x'))` in prod **does**.
  - In each route test file add "returns 400 on malformed JSON" (body `'{bad'`) for create, submit-trx, approve, reject; and `GET /api/admin/donations?page=abc` → 400.
- [ ] **Step 2:** Run → FAIL (currently 500s).
- [ ] **Step 3:** Implement helpers; replace each route's ad-hoc `request.json()` / `JSON.parse` / `Number(searchParams…)` with them. `admin/donations` uses a zod query schema `{ status?: DonationStatus, page, limit }` built from `paginationSchema.extend`.
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5:** Commit `fix(api): return 400 for malformed input and stop persisting 4xx errors`.

### Task 4: Redis must not throw at import

**Files:** Modify `src/lib/redis.ts`; Test `tests/lib/redis.test.ts` (new)

- [ ] **Step 1: Failing test:** with `NODE_ENV=production` and `REDIS_URL` unset (`vi.stubEnv`, `vi.resetModules`), `await import('@/lib/redis')` resolves (does not throw) and `logger.error` was called once with a message containing `REDIS_URL`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Replace the top-level `throw` with `logger.error(...)`; client still built against the fallback URL with `lazyConnect` so commands fail at call time (callers already catch). Update the header comment to describe the new behaviour.
- [ ] **Step 4:** PASS. **Step 5:** Commit `fix(redis): log instead of throwing at import when REDIS_URL is missing`.

### Task 5: Donation integrity (TrxID uniqueness, review races, idempotency)

**Files:**

- Create: `prisma/migrations/20261028000000_trx_id_partial_unique/migration.sql`, `scripts/check-duplicate-trx.ts`
- Modify: `prisma/schema.prisma` (comment on `trxId` noting the partial unique index lives in raw SQL — Prisma can't express it), `src/app/api/donations/[id]/submit-trx/route.ts`, `src/app/api/admin/donations/[id]/approve/route.ts`, `src/app/api/admin/donations/[id]/reject/route.ts`, `src/app/api/donations/create/route.ts`, `package.json` (script `db:check-duplicate-trx`)
- Test: `tests/api/donations-submit-trx.test.ts`, `tests/api/admin-donations-review.test.ts`, `tests/api/donations-create.test.ts`

Migration SQL (exact):

```sql
CREATE UNIQUE INDEX "Donation_trxId_active_key"
  ON "Donation" ("trxId")
  WHERE "trxId" IS NOT NULL AND "status" NOT IN ('FAILED', 'CANCELLED');
```

`scripts/check-duplicate-trx.ts`: prints groups of `trxId` with >1 row whose status is not FAILED/CANCELLED (id, status, userId, createdAt) and exits 1 if any exist, 0 otherwise. Never modifies data.

Behaviour:

- submit-trx: drop the pre-check `findFirst`; wrap the update in try/catch; Prisma `P2002` → `ConflictError` with code `TRX_ALREADY_USED` (add `code` override param to `ConflictError(message, code = 'CONFLICT')`). Response no longer contains `redirectUrl` (client builds it from its locale — Task 17).
- approve / reject: `prisma.donation.updateMany({ where: { id, status: 'PENDING' }, data })`; `count === 0` → re-read; if now SUCCESS and action is approve → existing "Already approved" ok response; otherwise `ConflictError('Donation already reviewed', 'ALREADY_REVIEWED')`. Approve still requires `trxId` (checked on the pre-read).
- create: Redis key `idem:donation:${session.user.id}:${body.idempotencyKey}`; replace create+update with `prisma.$transaction(async (tx) => { const d = await tx.donation.create(...); return tx.donation.update({ where: { id: d.id }, data: { bkashPaymentId: d.id } }); })`.

- [ ] **Step 1: Failing tests:**
  - submit-trx: `update` rejects with `{ code: 'P2002' }` (`Prisma.PrismaClientKnownRequestError`) → status 409, `error === 'TRX_ALREADY_USED'`.
  - approve: `updateMany` resolves `{ count: 0 }`, re-read returns `status: 'FAILED'` → 409 `ALREADY_REVIEWED`; re-read `SUCCESS` → 200 "Already approved". reject: `count: 0` → 409.
  - create: redis `get` called with `idem:donation:u1:<uuid>`; `prisma.$transaction` called once.
    (Update mocks: add `updateMany`, `$transaction` implementing `fn(mocks.prisma)`.)
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `fix(donations): enforce unique active TrxID and make review/create race-safe`.

### Task 6: Public stats

**Files:** Create `src/lib/stats.ts`, `src/app/api/public/stats/route.ts`, `tests/lib/stats.test.ts`, `tests/api/public-stats.test.ts`

**Interfaces — Produces:**

```ts
// src/lib/stats.ts
export interface PublicStats {
  totalRaised: string; // Decimal as string, SUCCESS donations only
  donorCount: number; // distinct userId with ≥1 SUCCESS (null userIds excluded)
  donationCount: number; // SUCCESS rows
  byPurpose: Record<'GENERAL_FUND' | 'EDUCATION' | 'MEDICAL' | 'EMERGENCY', string>; // all four keys, '0' when none
  updatedAt: string; // ISO
}
export async function getPublicStats(): Promise<PublicStats>;
```

Banned/deleted users' donations count (no user filter). Cache in Redis key `public:stats:v1`, `EX 60`; Redis read/write failures are logged and fall through to DB. Route: `GET` → `ok(stats)` with header `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`; errors → `fail()`.

- [ ] **Step 1: Failing tests:** aggregates mocked (`donation.aggregate`, `donation.groupBy`, distinct count via `donation.findMany({ distinct: ['userId'] })` or `groupBy({ by: ['userId'] })` — implementer's choice, mock accordingly): expect `byPurpose` contains all four keys with `'0'` defaults; cache hit returns cached JSON without hitting prisma; `redis.get` throwing still returns DB result. Route test: 200 + `Cache-Control` header.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(api): add cached public donation stats`.

### Task 7: Reports in Dhaka time, safe health check

**Files:** Modify `src/app/api/admin/reports/route.ts:39-43`, `src/app/api/health/route.ts`; Create `src/lib/time.ts`; Test `tests/lib/time.test.ts`, `tests/api/health.test.ts`

**Interfaces — Produces (`src/lib/time.ts`):**

- `startOfDhakaDay(now?: Date): Date` — UTC instant of 00:00 Asia/Dhaka (UTC+6, no DST) for the day containing `now`
- `dhakaMonthKey(date: Date): string` — `'YYYY-MM'` in Dhaka time

- [ ] **Step 1: Failing tests:** `startOfDhakaDay(new Date('2026-03-01T19:00:00Z')).toISOString() === '2026-03-01T18:00:00.000Z'`; `dhakaMonthKey(new Date('2026-01-31T19:30:00Z')) === '2026-02'`; health `?deep=1` with prisma throwing `Error('password=secret')` → body has `db: 'fail'` and the response text does not contain `secret`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement; reports use the helpers for "today" and month buckets; health returns `{ status, db: 'ok'|'fail', redis: 'ok'|'fail' }` only. **Step 4:** PASS.
- [ ] **Step 5:** Commit `fix: bucket reports in Asia/Dhaka and stop leaking errors from health`.

### Task 8: Auth routing (middleware, login callback, banned tokens)

**Files:**

- Create: `src/lib/auth/route-guard.ts`, `tests/lib/route-guard.test.ts`
- Modify: `src/middleware.ts` (remove the `/api/auth` rate-limit block, the `/api/admin` 403 block, `isPublicApi`, `redirectWithIntl` header copying; use `resolveRouteGuard`), `src/lib/auth/next-auth.ts:342` (params become `{ access_type: 'offline', response_type: 'code' }`), `src/lib/security/edge-rate-limit.ts` (delete if it has no remaining importer), `src/app/[locale]/admin/layout.tsx` and `(authenticated)/layout.tsx` (server-side fallback redirect to `/${locale}/login?callbackUrl=…` for both)

**Interfaces — Produces:**

```ts
export type GuardResult = { action: 'next' } | { action: 'redirect'; to: string };
export function resolveRouteGuard(input: {
  pathname: string;
  search: string;
  locale: 'bn' | 'en';
  token: { id?: unknown; role?: unknown } | null;
}): GuardResult;
```

Rules: logged in ⇔ `typeof token?.id === 'string'` (the empty `{}` returned for banned/deleted users is logged out). Protected prefixes `/{l}/dashboard|donate|history|settings` and `/{l}/admin`: logged out → `/{l}/login?callbackUrl=<encodeURIComponent(pathname+search)>`. Admin prefix, logged in, role ≠ `'ADMIN'` → `/{l}/dashboard`. Logged-in user on `/{l}/login` → `/{l}/dashboard`. Everything else `next`. Exact-prefix matching (`/en/admin-x` is not admin).
Redirect construction in middleware: `const res = NextResponse.redirect(url)`; then append only `set-cookie` values from the intl response via `res.headers.append` (iterate `intlResponse.headers.getSetCookie()`).

- [ ] **Step 1: Failing tests** (`route-guard.test.ts`): each rule above, including `token: {}` → treated as logged out on `/bn/history`; `/en/admin-dashboard-fake` → next; `/en/donate` + `?x=1` → `/en/login?callbackUrl=%2Fen%2Fdonate%3Fx%3D1`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement + wire middleware. Remove the now-dead header/comment blocks. **Step 4:** PASS; `pnpm type-check`.
- [ ] **Step 5:** Commit `fix(auth): redirect to login with callbackUrl and treat revoked tokens as signed out`.

(The login page that consumes `callbackUrl` is rebuilt in Task 14.)

### Task 9: Non-UI folder restructure + single document root

**Files:**

- Move (`git mv`): `src/lib/hooks/*` → `src/hooks/*`; `src/i18n.ts` → `src/lib/i18n/request.ts` (fix relative messages import to `../../../messages/`); `src/app/[locale]/(public)` → `(marketing)`; `src/app/[locale]/(authenticated)` → `(app)`; `src/app/[locale]/page.tsx` → `src/app/[locale]/(marketing)/page.tsx`
- Modify: `next.config.js` (`createNextIntlPlugin('./src/lib/i18n/request.ts')`), all `@/lib/hooks/` imports → `@/hooks/`, tests importing hooks, `docs/PROJECT_STRUCTURE.md` (new tree from spec)
- Modify: `src/app/layout.tsx` → returns `children` only (keep `metadata` defaults? No — move metadata/viewport to the locale layout); `src/app/[locale]/layout.tsx` renders the single `<html lang={locale} className={hind.variable}>` with font + `generateMetadata` (title from `common.appName`, localized). Root `not-found.tsx`/`error.tsx` at `src/app/` need their own html when hit outside a locale: keep `src/app/not-found.tsx` rendering a minimal `<html><body>` redirect link to `/bn` (it's the only top-level page); `src/app/error.tsx` moves to `src/app/[locale]/error.tsx` (redesigned in Task 14). Add `src/app/global-error.tsx` with its own html.

- [ ] **Step 1:** Moves + import fixes.
- [ ] **Step 2:** `pnpm type-check && pnpm lint && pnpm test` → PASS.
- [ ] **Step 3:** `pnpm build` with dummy env (`DATABASE_URL=postgresql://x:x@localhost:5432/x NEXTAUTH_SECRET=dev AUTH_SECRET=dev GOOGLE_CLIENT_ID=x GOOGLE_CLIENT_SECRET=x`) → succeeds (also proves the stray page export from the audit; remove `export { AdminStatsCard }` from `admin/dashboard/page.tsx` here if build flags it).
- [ ] **Step 4:** Commit `refactor: reorganise route groups, hooks and i18n; single html root`.

---

## Phase 2 — UI redesign

Every page task: replace the page body with feature components, delete the old components it used, move its strings into messages (bn + en), and verify with a Playwright screenshot at 390px and 1280px in `bn` (dev server, `pnpm dev`). Pages needing a session are verified by temporarily viewing with a seeded dev DB if available; otherwise verify rendering via unit tests and note it in the task report.

### Task 10: Design tokens, theme, base deps

**Files:** Modify `src/app/globals.css`, `tailwind.config.ts`, `package.json`; Create `src/components/layout/providers.tsx` (replaces `Providers.tsx`), `src/components/layout/theme-sync.tsx`, `src/hooks/use-update-settings.ts` (if no existing mutation hook — check `use-profile.ts`)

- Add deps: `next-themes`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-accordion`, `@radix-ui/react-avatar`, `@radix-ui/react-progress`, `@radix-ui/react-switch`, `sonner` (toasts).
- Tokens (HSL triplets on `:root` and `.dark`): `--background 0 0% 99%`, `--foreground 160 25% 10%`, `--card 0 0% 100%`, `--muted 150 15% 96%`, `--muted-foreground 160 8% 42%`, `--border 150 12% 90%`, `--primary 160 84% 30%` (~#0C8A5F), `--primary-foreground 0 0% 100%`, `--primary-soft 152 60% 95%`, `--bkash 332 88% 48%`, `--warning 38 92% 50%`, `--success 152 70% 36%`, `--destructive 0 72% 48%`, `--ring = --primary`. Dark: background `160 25% 7%`, card `160 20% 10%`, border `160 12% 18%`, primary `158 64% 45%`, primary-soft `160 40% 14%`. Builder may tune values but keep the hue roles. Remove `--admin`, `--secondary`, `--accent` as distinct concepts (alias to muted) and remove the `admin` Tailwind colour.
- Tailwind: radius `lg: 16px, md: 12px, sm: 8px`; `boxShadow.card = '0 1px 2px hsl(160 20% 10% / .04), 0 4px 16px hsl(160 20% 10% / .06)'`; container `2xl: 1200px`; `fontFamily.sans = var(--font-hind)`; keyframes `count-up` not needed (JS); `progress-fill` keyframe.
- Base CSS: `body { line-height: 1.65 }`, `:lang(bn) h1,h2,h3 { line-height: 1.35 }`, `@media (prefers-reduced-motion: reduce)` disables animations/transitions.
- Providers: `ThemeProvider` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`) → `SessionProvider` → `QueryClientProvider` → `<Toaster richColors position="top-center" />`. `ThemeSync` (client, rendered inside providers): when `useSession().status === 'authenticated'`, fetch settings once and `setTheme(settings.theme.toLowerCase())` (map `LIGHT|DARK|SYSTEM` — check the enum/strings the settings API actually stores); exposes nothing. The theme toggle (Task 12) calls `setTheme` and, if authenticated, `PUT /api/users/settings { theme }`.

- [ ] **Step 1:** Test `tests/components/theme-sync.test.tsx`: authenticated session + settings `{ theme: 'DARK' }` → `setTheme('dark')` called once; unauthenticated → settings never fetched.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS + type-check.
- [ ] **Step 5:** Commit `feat(ui): new design tokens, theme provider and toasts`.

### Task 11: UI primitives

**Files:** Replace/create in `src/components/ui/`: `button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `select.tsx`, `badge.tsx`, `progress.tsx`, `avatar.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `tabs.tsx`, `accordion.tsx`, `switch.tsx`, `table.tsx`, `skeleton.tsx`, `stat-card.tsx`, `empty-state.tsx`, `page-header.tsx`, `field.tsx` (label + control + error text). Test: `tests/components/ui.test.tsx`

**Interfaces — Produces:**

- `Button` variants: `primary | secondary | outline | ghost | bkash | destructive`; sizes `sm | md | lg | icon`; `asChild`; `loading?: boolean` (spinner + `aria-busy`, disabled). Pill radius (`rounded-full`).
- `Badge` variants: `neutral | success | warning | danger | info | primary`.
- `donationStatusVariant(status: 'PENDING'|'SUCCESS'|'FAILED'|'CANCELLED'): BadgeVariant` exported from `badge.tsx` → `warning | success | danger | neutral`.
- `StatCard({ label: string; value: ReactNode; hint?: ReactNode; icon?: LucideIcon; loading?: boolean })`
- `EmptyState({ icon: LucideIcon; title: string; description?: string; action?: ReactNode })`
- `PageHeader({ title: string; description?: string; actions?: ReactNode })`
- `Field({ label: string; htmlFor: string; error?: string; hint?: string; children })`
- `Progress({ value: number /*0-100, clamped*/ ; label?: string })` — Radix progress, `aria-valuenow`.

- [ ] **Step 1: Failing tests:** `Button loading` is disabled with `aria-busy="true"`; `donationStatusVariant` mapping for all four; `Progress value={140}` sets `aria-valuenow="100"`; `Field error="x"` links input via `aria-describedby`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement (shadcn-style, cva). Existing importers of old `button/card/input/label/select` must keep compiling — keep export names `Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Label, Select*`; old `variant="default"` callers → map to `primary` (grep and update).
- [ ] **Step 4:** PASS + type-check. **Step 5:** Commit `feat(ui): design-system primitives`.

### Task 12: Marketing shell + auth buttons

**Files:**

- Create: `src/components/layout/site-header.tsx`, `mobile-nav.tsx` (Radix dialog slide-over), `site-footer.tsx`, `language-switcher.tsx`, `theme-toggle.tsx`, `logo.tsx`; `src/features/auth/sign-in-button.tsx`, `sign-out-button.tsx`; `src/app/[locale]/(marketing)/layout.tsx` (header + `<main>` + footer)
- Delete: `src/components/layout/{Header,Footer,MobileMenu,LanguageSwitcher,SignInButton,SignOutButton,UserMenu}.tsx`, `src/components/landing/LandingNav.tsx`
- Modify: `src/app/[locale]/layout.tsx` (no header/footer — groups own their chrome), `tests/auth/SignOutButton.test.tsx` → `tests/features/auth/sign-out-button.test.tsx`
- Messages: `nav.*`, `footer.*`, new `a11y.{openMenu,closeMenu,language,theme,userMenu}`, `theme.{light,dark,system}`

**Interfaces — Produces:**

- `SignInButton({ callbackUrl?: string; variant?; size?; className? })` → `signIn('google', { callbackUrl: callbackUrl ?? `/${locale}/dashboard` })`
- `SignOutButton({ variant?; className?; asMenuItem?: boolean })` → `signOut({ callbackUrl: `/${locale}` })`
- `LanguageSwitcher()` — keeps current path, swaps locale segment, preserves search.
- `ThemeToggle()` — cycles light/dark/system via dropdown; persists for signed-in users (see Task 10).
- Header contents: logo, links Home/About/Blog/Alumni (active state via `usePathname`), LanguageSwitcher, ThemeToggle, then signed-out → `SignInButton` (ghost) + "Donate" primary link to `/{l}/donate`; signed-in → "Dashboard" link + avatar. Sticky, `bg-background/80 backdrop-blur`, border-bottom on scroll.

- [ ] **Step 1: Failing tests:** sign-out test (moved) asserts `signOut` called with `{ callbackUrl: '/bn' }` using an accessible role query, not copy; `LanguageSwitcher` on `/bn/about?x=1` links to `/en/about?x=1`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS; screenshot header + mobile menu (bn, light/dark).
- [ ] **Step 5:** Commit `feat(ui): marketing header, footer, mobile nav and auth buttons`.

### Task 13: Landing page

**Files:**

- Create: `src/lib/config/causes.ts`, `src/features/landing/{hero,hero-stats,causes,how-it-works,people,events,stories,faq,trust,cta-banner,count-up,section-heading}.tsx`, `public/images/stories/story-placeholder.svg`
- Modify: `src/app/[locale]/(marketing)/page.tsx`, `messages/{bn,en}.json` (`landing.*`: remove activity/register keys no longer used, add hero stat labels, cause goal label, event/stories/trust copy as needed)
- Delete: all of `src/components/landing/`
- Test: `tests/features/landing/hero-stats.test.tsx`, `tests/features/landing/causes.test.tsx`

**Interfaces:**

- Consumes `getPublicStats()` (Task 6) — the page (server component) calls it in `try/catch`, passing `stats: PublicStats | null`; page sets `export const revalidate = 60`.
- `CAUSES: ReadonlyArray<{ purpose: DonationPurpose; icon: LucideIcon; goal: number /*BDT*/ ; nameKey: string; descKey: string }>` in `lib/config/causes.ts`, placeholder goals `GENERAL_FUND 100000, EDUCATION 75000, MEDICAL 50000, EMERGENCY 25000`, with a comment telling the owner to edit.
- `HeroStats({ stats: PublicStats | null; locale: AppLocale })` — null → renders nothing numeric (no zeros); otherwise total raised (CountUp) + donor count + donation count.
- `Causes({ stats, locale })` — card per cause; raised from `stats.byPurpose`, progress = raised/goal; if `stats` null, hide raised + progress.
- `CountUp({ value: number; format: (n: number) => string })` — animates on intersect, instant under reduced motion.

Section order per spec: hero, causes, how-it-works, people (portraits from `public/images/people/portrait-{1,2,3}.svg` via `next/image`), events, stories, FAQ (Radix accordion), trust, CTA banner (`bg-gradient-to-br from-primary to-emerald-700`, white text).

- [ ] **Step 1: Failing tests:** `HeroStats stats={null}` renders no element with `data-testid="hero-total"`; with stats `{ totalRaised: '125000', … }` and locale `en` the total text contains `125,000` (after CountUp completes — mock `matchMedia` reduced motion so it renders instantly); `Causes` with `byPurpose.MEDICAL='25000'` and goal 50000 → MEDICAL progress `aria-valuenow="50"`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS; screenshots 390/1280 bn+en, light+dark.
- [ ] **Step 5:** Commit `feat(landing): redesigned landing page with live stats`.

### Task 14: Login, content pages, error pages

**Files:**

- Modify: `src/app/[locale]/(marketing)/login/page.tsx` (+ client `src/features/auth/login-card.tsx`), `about/page.tsx`, `blog/page.tsx`, `alumni/page.tsx`, `src/app/[locale]/error.tsx`, create `src/app/[locale]/not-found.tsx`, update `src/app/not-found.tsx`, `src/app/global-error.tsx`
- Messages: `auth.*`, `about.*` (split body into paragraphs array keys `body1..bodyN` or keep one and render with `whitespace-pre-line` — builder's call), `errors.*` (`notFoundTitle`, `notFoundBody`, `errorTitle`, `errorBody`, `goHome`, `tryAgain`)

Behaviour: login no longer auto-calls `signIn` on mount. `LoginCard({ callbackUrl: string; error?: string })` shows logo, welcome copy, `SignInButton callbackUrl={callbackUrl}`, error alert (existing NextAuth error mapping). Page reads `searchParams.callbackUrl` and passes it through `safeCallbackUrl` (`src/lib/utils/safe-callback-url.ts` — check its exact signature) with fallback `/${locale}/dashboard`.

- [ ] **Step 1: Failing tests** `tests/features/auth/login-card.test.tsx`: clicking the button calls `signIn('google', { callbackUrl: '/en/donate' })`; `signIn` is **not** called on mount; error `'OAuthCallback'` renders an alert role. Page-level: `callbackUrl=https://evil.com` resolves to `/en/dashboard` (unit-test the helper call via the page's exported `resolveLoginCallback(raw, locale)` in `login-card.tsx` or a small module).
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS; screenshots.
- [ ] **Step 5:** Commit `feat(ui): redesigned login, content and error pages`.

### Task 15: App shell (donor + admin)

**Files:**

- Create: `src/components/layout/app-shell.tsx`, `app-sidebar.tsx`, `app-topbar.tsx`, `user-menu.tsx`, `src/lib/config/nav.ts`
- Modify: `src/app/[locale]/(app)/layout.tsx`, `src/app/[locale]/admin/layout.tsx`
- Delete: `src/components/layout/Sidebar.tsx`
- Test: `tests/components/app-sidebar.test.tsx`

**Interfaces — Produces:**

- `APP_NAV: { key: string; href: (l: AppLocale) => string; icon: LucideIcon; adminOnly?: boolean; userOnly?: boolean }[]` — user group: dashboard, donate (`userOnly`, admins can't donate), history, settings; admin group: admin dashboard, users, donations, reports.
- `AppShell({ user: { name: string; email: string; image?: string|null; role: 'USER'|'ADMIN' }; children })` — desktop: fixed 260px sidebar (collapsible to 72px icons, state in `localStorage` wrapped in try/catch), topbar with page title slot (`PageHeader` is per page, topbar shows breadcrumb/brand on mobile), LanguageSwitcher, ThemeToggle, UserMenu. Mobile: topbar + slide-over nav (reuse `mobile-nav` dialog pattern). Admin role shows "Admin" badge next to the brand and the admin group.

- [ ] **Step 1: Failing test:** sidebar for role USER has no link to `/bn/admin/users`; for ADMIN it has it and has no "donate" link; active link has `aria-current="page"` for `/bn/history`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement; both layouts render `AppShell` with session user. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(ui): app shell with sidebar, topbar and user menu`.

### Task 16: Donor dashboard + history

**Files:**

- Create: `src/features/donation/{donation-list,donation-list-item,donation-status-badge}.tsx`, `src/features/dashboard/{dashboard-stats,donate-again-card}.tsx`
- Modify: `src/hooks/use-donations.ts` (add `useDonationHistoryInfinite`), `src/app/[locale]/(app)/dashboard/page.tsx`, `history/page.tsx`, `src/types/donation.ts` (ensure history response includes `pagination: { page, limit, total, totalPages }` — check route), `src/app/api/users/profile/route.ts` (add `pendingCount` to response if not present)
- Test: `tests/lib/use-donations-hook.test.ts` (extend), `tests/features/donation/donation-list.test.tsx`

**Interfaces — Produces:**

- `useDonationHistoryInfinite(params: { status?: DonationStatus; limit?: number })` → `useInfiniteQuery` with key `['donations','history',params]`, `getNextPageParam` from `pagination.page < pagination.totalPages`.
- `DonationList({ items: DonationHistoryItem[]; locale: AppLocale; compact?: boolean })`; item shows purpose icon (from `CAUSES`), localized purpose name, amount (`formatBDT`), date (`formatDate`), status badge, and for PENDING without trxId a "Submit TrxID" link to `/{l}/donate/submit?id=…`.
- Dashboard: greeting, `StatCard`s from `useProfile()` — total donated (`totalDonated`), donation count, pending count — never from the history page; donate-again card (hidden for admins); 5 most recent via history `limit=5`.
- History: `Tabs` all/pending/success/failed (maps to `status` param), list + "Load more" button, `EmptyState` when empty, skeletons while loading, error card with retry.

- [ ] **Step 1: Failing tests:** infinite hook requests `/donations/history?page=2&limit=20` for the second page and stops when `page === totalPages`; `DonationList` PENDING item with `trxId: null` has a link to `/bn/donate/submit?id=d1`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS; screenshots (if no session available, document).
- [ ] **Step 5:** Commit `feat(ui): donor dashboard and paginated history`.

### Task 17: Donate flow

**Files:**

- Create: `src/features/donation/{donate-stepper,amount-picker,cause-picker,donate-form,bkash-instructions,trx-form,pending-state}.tsx`
- Modify: `src/app/[locale]/(app)/donate/page.tsx`, `donate/submit/page.tsx` (becomes a **server** component that reads `BKASH_RECEIVER_NUMBER` from `@/lib/payment` and renders `<TrxForm receiverNumber=… donationId=… />`), `donate/pending/page.tsx`, `src/lib/payment/index.ts` (drop `PAYMENT_INSTRUCTIONS`; keep `BKASH_RECEIVER_NUMBER`, `PAYMENT_METHOD`; add `import 'server-only'`)
- Delete: `src/components/donation/AmountSelector.tsx`
- Test: `tests/features/donation/donate-form.test.tsx`, `tests/features/donation/trx-form.test.tsx`

Behaviour:

- `DonateForm` keeps `const [idempotencyKey] = useState(() => crypto.randomUUID())` — one key per form mount, reused on retry. Presets `[100, 500, 1000, 2000, 5000]`, custom input, min 10 / max 100000 (reuse `createDonationSchema` client-side). Cause picker cards from `CAUSES`. Summary panel. Submit → `POST /api/donations/create` → `router.push('/{l}/donate/submit?id=' + donationId)`. Admin redirect stays (server check in page).
- `DonateStepper({ step: 1|2|3|4 })` — labels from `donation.steps.*`.
- `BkashInstructions({ receiverNumber: string; amount: string; reference: string })` — bKash-pink card, copy buttons (number, reference) using `navigator.clipboard` with toast.
- `TrxForm` posts `submit-trx`; on success `router.push('/{l}/donate/pending?id=…')` using the current locale (not the API). On error, map `error` code via `errors.codes.<CODE>` (fallback `errors.serverError`), e.g. `TRX_ALREADY_USED`.
- Pending page: success illustration (lucide `CircleCheck` in soft-primary circle), reference id, links to history and home.

- [ ] **Step 1: Failing tests:** submitting twice after a failed first attempt posts the **same** `idempotencyKey`; `TrxForm` renders the `receiverNumber` prop (`01999999999`), and on API `{ success:false, error:'TRX_ALREADY_USED' }` shows the translated message (use test messages); success pushes `/en/donate/pending?id=d1` when locale is `en`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS; screenshots.
- [ ] **Step 5:** Commit `feat(ui): redesigned donate flow; bKash number served from server`.

### Task 18: Settings

**Files:**

- Create: `src/features/profile/{profile-form,preferences-form}.tsx`
- Modify: `src/app/[locale]/(app)/settings/page.tsx`, messages `settings.*` (remove notifications/security/changePassword/deleteAccount keys)
- Test: `tests/features/profile/preferences-form.test.tsx`

Behaviour: Profile card (avatar, name, email read-only, phone with `BD_PHONE_REGEX` via existing `validation/user` schema) → `PATCH /api/users/profile`. Preferences card: language (on save, also navigate to the new locale path) and theme (calls `setTheme` + `PUT /api/users/settings { theme }`). Notification/receipt toggles are not rendered. Success/error via toast.

- [ ] **Step 1: Failing test:** changing theme to dark and saving calls `PUT /api/users/settings` with body containing the theme value the API expects, and no `emailNotifications` control is in the document.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(ui): redesigned settings`.

### Task 19: Admin pages

**Files:**

- Create: `src/features/admin/{admin-overview,users-table,ban-dialog,review-queue,review-dialog,reports-panel,charts}.tsx`
- Modify: `src/app/[locale]/admin/{dashboard,users,donations,reports}/page.tsx`, messages `admin.*` (all strings currently hardcoded in the admin components)
- Delete: `src/components/admin/*`
- Test: `tests/features/admin/review-dialog.test.tsx`, `tests/features/admin/admin-overview.test.tsx`

Behaviour:

- Overview: `StatCard`s (total raised, this month, pending review, users), small recharts area chart of monthly totals, quick links. On query error, an error card with retry (never silent zeros).
- Users: search input (debounced 300ms), filter tabs (all / banned / admins — use whatever filters `GET /api/admin/users` supports), table on ≥md, cards on mobile; ban opens `BanDialog` (reason required) → `POST …/ban`; unban confirm → `DELETE …/unban`; toasts.
- Donations review: queue of pending-with-TrxID cards showing donor, amount, purpose, TrxID (copy), sender phone, submitted time; Approve (confirm) / Reject (`ReviewDialog` with required note). 409 responses show `errors.codes.ALREADY_REVIEWED` toast and refetch.
- Reports: stat cards, bar chart by purpose, line chart by month (colours from CSS vars via `hsl(var(--primary))` etc.), CSV export button (keeps `?format=csv`, via `<a href download>`).

- [ ] **Step 1: Failing tests:** `ReviewDialog` reject submit is disabled until a note is typed; 409 response triggers the `ALREADY_REVIEWED` message; `AdminOverview` with a query error shows a retry button and no `0` stat values.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS; screenshots.
- [ ] **Step 5:** Commit `feat(admin): redesigned admin dashboard, users, review and reports`.

### Task 20: i18n sweep

**Files:** Modify any remaining component with literals; `messages/{bn,en}.json` (add `errors.codes.{VALIDATION_ERROR,UNAUTHORIZED,FORBIDDEN,NOT_FOUND,CONFLICT,RATE_LIMIT_EXCEEDED,TRX_ALREADY_USED,ALREADY_REVIEWED,INTERNAL_ERROR}`); Create `src/lib/i18n/error-message.ts`; Test `tests/lib/messages-parity.test.ts`

**Interfaces — Produces:** `apiErrorKey(error: unknown): string` → `errors.codes.<CODE>` when `error` is an `ApiClientError` whose code is in the list, else `errors.serverError`. (Tasks 17/19 may have created an inline version — replace it with this.)

- [ ] **Step 1: Failing test:** parity test — flattened key sets of bn and en are equal and no value is an empty string; `apiErrorKey(new ApiClientError({code:'TRX_ALREADY_USED'…}))` returns `errors.codes.TRX_ALREADY_USED` (check `ApiClientError` constructor shape in `src/lib/api/errors.ts`).
- [ ] **Step 2:** FAIL (if parity already holds, the `apiErrorKey` part fails). **Step 3:** Implement; `grep -rnP '>[^<{}\s][^<{}]*[A-Za-z\x{0980}-\x{09FF}]' src/features src/components src/app --include=*.tsx` and fix remaining literals, plus English `aria-label=` strings. Remove unused message keys.
- [ ] **Step 4:** PASS. **Step 5:** Commit `fix(i18n): localize remaining strings and API error codes`.

---

## Phase 3 — Verification & delivery

### Task 21: E2E rewrite and full verification

**Files:** Rewrite `e2e/tests/{smoke,auth-redirects,auth-login}.spec.ts`; delete `e2e/fixtures/user.ts` if still unused skeleton.

Tests (role/testid selectors, both projects chromium + mobile):

- smoke: `/bn` and `/en` respond 200, `html[lang]` matches, header nav and the "donate" CTA are visible, page has an `h1`.
- auth-redirects: `/en/dashboard`, `/bn/history`, `/en/admin/users` → URL matches `/\/(en|bn)\/login\?callbackUrl=/` with the encoded original path.
- auth-login: `/en/login` stays on `/en/login` and shows a button whose accessible name matches `messages/en.json` `auth.loginWithGoogle` (import the JSON, don't hardcode).

- [ ] **Step 1:** `pnpm test:e2e --project=chromium` (dev server) → PASS; then `--project=mobile` → PASS.
- [ ] **Step 2:** `pnpm type-check && pnpm lint && pnpm test && pnpm build` (dummy env as in Task 9) → all PASS.
- [ ] **Step 3:** Screenshot walkthrough: every public page at 390 and 1280, bn + en, light + dark, saved to the session scratchpad; review for overflow, cramped Bangla, contrast, pink misuse. Fix findings.
- [ ] **Step 4:** Commit `test(e2e): rewrite e2e suite for redesigned UI`.

### Task 22: Docs + PR

**Files:** `README.md` (status line, structure section → link to `docs/PROJECT_STRUCTURE.md`), `docs/PROJECT_STRUCTURE.md`, `docs/FRONTEND_PLANNING.md` (design system summary replacing the old register-style notes), `CHANGELOG.md` (Unreleased entry), deployment note: run `pnpm db:check-duplicate-trx` before `prisma migrate deploy`.

- [ ] **Step 1:** Update docs. **Step 2:** Commit `docs: document new structure, design system and migration step`.
- [ ] **Step 3:** Ask the owner before pushing; then `git push -u origin feat/ui-redesign` and `gh pr create` with summary, screenshots list, migration warning, ending with `https://claude.ai/code/session_01QTPQ2aiqrLqKE3hSCmfaBo`.
