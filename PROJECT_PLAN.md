# Donation Platform — Master Project Plan

**Project:** Donation Platform (School Organization)
**Audience:** Solo maintainer (`riftbond007`) + puku-cli
**Last Updated:** 2026-08-24
**Scope:** Your 5 priorities — user profile, admin profile, frontend↔backend wiring, CI (no deploy), landing page

> Synthesizes `README.md`, `docs/ARCHITECTURE.md`, `docs/FRONTEND_PLANNING.md`,
> `docs/BACKEND_PLANNING.md`, `docs/CI_CD_PIPELINE.md`, `.claude/agents/*`,
> and the current repo state.
> When this plan and the existing docs diverge, **this plan wins** — but update the docs.

---

## 0. Context & Goal

A production-grade donation web platform for a school-run organization.

- **Scale:** ~1,000 users/month
- **Stack:** Next.js 15 (App Router) · PostgreSQL 16 · Redis 7 · NextAuth v5 · bKash PGW · next-intl
- **Locales:** Bangla (default, `/bn/*`) + English (`/en/*`)
- **Roles:** `user` (donate + own profile), `admin` (user mgmt + read-only reports)
- **Scope of this plan (5 priorities):**
  1. Complete user profile
  2. Complete admin profile
  3. Wire frontend with backend
  4. CI working perfectly (no deployment)
  5. Landing page properly
- **Deployment:** out of scope for this round (Docker/VPS work deferred).

---

## 1. Guiding Principles

1. **Donation flow is self-service & automated.** Admins don't approve donations.
   They only manage users and view reports. Don't build admin approval flows.
2. **Trust nothing from the client.** Every API validates with Zod.
3. **Hardened middleware.** Auth + i18n redirects must preserve Set-Cookie + Vary
   headers from `intlMiddleware` (already enforced in `src/middleware.ts`).
4. **i18n parity.** Every user-facing string in **both** `messages/bn.json` and
   `messages/en.json` in the same PR.
5. **Type safety end-to-end.** No `any` in committed code. Strict TS,
   `noUncheckedIndexedAccess`.
6. **Test before merge.** Unit tests for utils/hooks, integration tests for APIs,
   E2E tests for user flows. Coverage floor: 80/80/80/75.
7. **Conventional Commits.** `<type>(<scope>): <subject>`, ≤72 chars, lowercase,
   no trailing period. Enforced by commitlint + husky.

---

## 2. Build Order (5 Priorities, Scoped)

| # | Milestone | Branch naming | Depends on |
|---|-----------|---------------|------------|
| **P1** | Complete user profile | `feat/user-profile` | current scaffold |
| **P2** | Complete admin profile | `feat/admin-profile` | P1 |
| **P3** | Frontend ↔ backend wiring | `feat/api-web-warnings` (rename as needed) | P1, P2 |
| **P4** | CI perfectly working (no deploy) | `ci/green-pipeline` | P1, P2, P3 |
| **P5** | Landing page | `feat/landing-page` | P3 |

> All branches merge into `develop`. `main` is left untouched in this round.

---

## 3. Milestone Details

### P1 — Complete user profile

**Goal:** Logged-in `user` can fully view + edit their own profile, see their donation
history, and complete any missing fields. The profile-completion flow (phone for bKash)
must gate the dashboard.

**Files to touch / create:**

| Path | Action |
|---|---|
| `src/app/api/users/profile/route.ts` | `GET` / `PATCH` — name, phone, languagePref, avatarUrl |
| `src/app/api/users/settings/route.ts` | `GET` / `PATCH` — emailNotifications, donationReceipts, theme |
| `src/app/api/users/complete-profile/route.ts` | Already partial — finalize (Zod: phone, name) |
| `src/app/[locale]/(authenticated)/settings/page.tsx` | Finalize — uses settings form |
| `src/app/[locale]/(requires-auth)/complete-profile/page.tsx` | Finalize — uses ProfileCompletionForm |
| `src/components/auth/ProfileCompletionForm.tsx` | Finalize — RHF + Zod, bn/en labels |
| `src/components/user/ProfileCard.tsx` | New — avatar, name, phone, language toggle |
| `src/components/user/SettingsForm.tsx` | New — RHF + Zod, switches for notifications/theme |
| `src/lib/validation/user.ts` | Keep; add `settingsSchema` if missing |
| `src/lib/hooks/use-profile.ts` | New — TanStack Query hooks (`useProfile`, `useUpdateProfile`) |
| `src/lib/api/client.ts` | Keep — fetch wrapper used by the hooks |
| `messages/bn.json`, `messages/en.json` | Add profile + settings keys in both |

**Reuse (do not rewrite):**
- `withAuth(handler)` from `src/lib/api/helpers.ts`
- `rateLimit('COMPLETE_PROFILE', ...)` from `src/lib/rate-limit.ts`
- `logSecurityEvent(...)` from `src/lib/audit.ts`
- `cn()` from `src/lib/utils.ts`
- shadcn primitives from `src/components/ui/`

**Verification:**
```bash
pnpm lint
pnpm type-check
pnpm test -- tests/lib/
pnpm test:e2e -- profile.spec.ts
# Manual: login → /bn/settings → change phone → reload → phone persisted
```

**Done when:**
- Profile page renders the current user's data.
- Settings save succeeds and survives reload.
- Profile-completion form blocks `/dashboard` until `phone` is set.
- All new strings present in both locale files.

---

### P2 — Complete admin profile

**Goal:** Logged-in `admin` can list/search all users, view their profile (read-only),
ban/unban users, and view aggregate donation reports. **No admin involvement in the
donation flow itself.**

**Files to touch / create:**

| Path | Action |
|---|---|
| `src/app/api/admin/users/route.ts` | `GET` (paginated + search), `PATCH` (ban/unban, role) |
| `src/app/api/admin/users/[id]/route.ts` | `GET` (full profile read) |
| `src/app/api/admin/reports/route.ts` | `GET` — totals, counts, time-series; **never** mutation |
| `src/app/[locale]/admin/users/page.tsx` | Users table page |
| `src/app/[locale]/admin/users/[id]/page.tsx` | Single-user admin view |
| `src/app/[locale]/admin/reports/page.tsx` | Reports dashboard (Recharts) |
| `src/components/admin/UsersTable.tsx` | Finalize — shadcn table, ban/unban actions |
| `src/components/admin/UserProfileCard.tsx` | New — read-only view for admin |
| `src/components/admin/ReportsChart.tsx` | New — Recharts wrapper, bn/en labels |
| `src/lib/hooks/use-admin-users.ts` | New — list + mutations |
| `messages/bn.json`, `messages/en.json` | Add admin keys in both |

**Authorization:** every handler calls `requireAdmin()`. `src/middleware.ts` already
returns 403 (not redirect) for `/api/admin/*` when role ≠ `ADMIN`.

**Reuse:** same lib files as P1 + `requireAdmin()` from `src/lib/auth/session.ts`.

**Verification:**
```bash
pnpm test -- src/lib/auth tests/lib/
pnpm test:e2e -- admin.spec.ts
# Manual: log in as ADMIN → /bn/admin/users → ban a user → next API call from
# that user returns 403.
```

**Done when:**
- Non-admin user gets 403 on `/api/admin/users`.
- Admin can ban/unban; user's `lastLoginAt` shows `null` after re-auth.
- Reports page renders totals + chart from seeded donations.
- All new strings present in both locale files.

---

### P3 — Frontend ↔ backend wiring

**Goal:** Every page that shows data actually fetches it; every form actually persists it.
No more placeholder UI, no more unused `useState` mocks.

**Scope (in priority order):**

1. **Auth pages**
   - `/bn/login` / `/en/login` → real `signIn('google')` call (NextAuth).
2. **Authenticated shell**
   - `Header`, `Sidebar`, `Footer` → real user data from `useAuth()`.
   - `LanguageSwitcher` → real cookie + URL update via `next-intl`.
3. **Profile + Settings** (touches P1's pages, makes sure hooks are wired)
   - Settings form → `PATCH /api/users/settings`; loading + error states from TanStack Query.
4. **Admin**
   - Users table → `GET /api/admin/users` with debounced search.
   - Reports → `GET /api/admin/reports`, loading skeletons.
5. **API client polish**
   - Centralized error toasts (Pino logger → console + toast).
   - Loading skeletons on every list page.
   - Empty states ("কোনো দান নেই" / "No donations yet").

**Files to touch / create:**

| Path | Action |
|---|---|
| `src/lib/hooks/use-auth.ts` | Finalize — returns `{ user, isLoading, signOut }` |
| `src/lib/api/client.ts` | Add toast on error; ensure `credentials: 'include'` |
| `src/components/layout/Header.tsx` | Finalize — uses `useAuth()` |
| `src/components/layout/Sidebar.tsx` | Finalize — role-aware nav items |
| `src/components/layout/SignOutButton.tsx` | Finalize — calls `signOut()` |
| `src/app/[locale]/(public)/login/page.tsx` | Finalize |
| All `(authenticated)` pages | Wire to real hooks, replace mock data |
| `src/components/ui/toast.tsx` | Add (shadcn) — needed for error feedback |

**Reuse:** shadcn `Button`, `Card`, `Input`, `Skeleton`, `Toast` (new).
`useAuth` returns `Session | null`; pages should `redirect('/login')` if null.

**Verification:**
```bash
pnpm test
pnpm test:e2e --headed   # walk through every page; confirm no "loading forever"
# In devtools network tab: every action results in an actual API request.
```

**Done when:**
- Every page renders data from the API (or honest empty states).
- Every form submits to the API and reflects the result.
- No console errors in the browser during a full navigation walk-through.

---

### P4 — CI perfectly working (no deploy)

**Goal:** Every push and PR runs lint + type-check + format-check + i18n parity + unit
tests + integration tests + E2E tests + build. No deploy job. CI must be deterministic,
fast where possible, and produce a green badge.

**Workflows to finalize (already partially exist):**

| Path | State | Action |
|---|---|---|
| `.github/workflows/ci.yml` | partial | Finalize — full pipeline |
| `.github/workflows/code-quality.yml` | partial | Finalize — add i18n parity |
| `.github/workflows/docker.yml` | exists | **Leave** — out of scope |
| `.github/workflows/deploy.yml` | exists | **Leave** — out of scope |

**Final `ci.yml` shape (no deploy):**

```yaml
name: CI
on:
  push: { branches: [main, develop] }
  pull_request: { branches: [main, develop] }
jobs:
  lint:           # pnpm lint
  format:         # pnpm format:check
  type-check:     # pnpm type-check
  i18n-parity:    # node scripts/i18n-parity-check.mjs
  unit:           # pnpm test:cov (vitest, jsdom + redis + postgres service)
  integration:    # pnpm test -- tests/lib/integration (uses real DB)
  e2e:            # pnpm test:e2e (Playwright + browsers)
  build:          # pnpm build (compile check)
```

**Targets:**

- **Determinism:** `--frozen-lockfile`, exact `node-version: 20`, `pnpm` via
  `pnpm/action-setup@v4`. No deploy-time env required.
- **Services:** Postgres 16 + Redis 7 via `services:` (already in `ci.yml`).
- **Coverage:** upload `coverage/lcov.info` to Codecov (already wired, keep).
- **E2E:** install Playwright browsers with `--with-deps chromium`. Use `webServer`
  with `pnpm start` against the built app (matches `playwright.config.ts`).
- **Caching:** `cache: pnpm` is already set; verify it actually fires.
- **Artifacts:** upload `playwright-report/` on failure (already present).

**New scripts (CI-only):**

| Path | Purpose |
|---|---|
| `scripts/i18n-parity-check.mjs` | Fails if keys differ between `bn.json` and `en.json` |
| `scripts/check-coverage-thresholds.mjs` | Fails if vitest thresholds not met |

**Done when:**
- Push to `develop` with a failing test → CI fails with the right job red.
- Push with everything passing → CI badge is green in <10 min.
- No deploy job runs (`.github/workflows/deploy.yml` and `docker.yml` left alone
  or disabled for this round).

---

### P5 — Landing page

**Goal:** A polished, bilingual, responsive landing page that loads fast, looks credible,
and funnels visitors toward login / donate.

**Route:** `/[locale]` (`src/app/[locale]/(public)/page.tsx`).

**Sections (top → bottom):**

1. **Hero** — bilingual headline + subhead + CTA buttons
   - Primary CTA: **Donate now** → `/[locale]/donate` (will work post-bKash; show as
     "Coming soon" until then, but still route correctly)
   - Secondary CTA: **Learn more** → `/[locale]/about`
2. **Trust strip** — small badge row: "Secure · Transparent · Verified"
3. **Impact counters** — animated number counters (total raised, total donations,
   total users) — read from `/api/public/stats` (new, public, read-only)
4. **Causes preview** — 3-4 cards (one per `DonationPurpose`) → `/[locale]/donate?purpose=...`
5. **How it works** — 3-step illustration (Login → Donate → Receipt)
6. **Testimonials** — placeholder cards (i18n strings only, no real testimonials yet)
7. **CTA banner** — full-width "Ready to make a difference?"
8. **Footer** — about, contact, language switcher, social (placeholders)

**Files to touch / create:**

| Path | Action |
|---|---|
| `src/app/[locale]/(public)/page.tsx` | Finalize — composes the sections |
| `src/components/landing/Hero.tsx` | New |
| `src/components/landing/TrustStrip.tsx` | New |
| `src/components/landing/ImpactCounters.tsx` | New — animated counters |
| `src/components/landing/CauseCard.tsx` | New |
| `src/components/landing/HowItWorks.tsx` | New |
| `src/components/landing/Testimonials.tsx` | New — placeholder |
| `src/components/landing/CtaBanner.tsx` | New |
| `src/app/api/public/stats/route.ts` | New — public read-only stats |
| `src/lib/hooks/use-public-stats.ts` | New — TanStack Query hook |
| `src/lib/stores/ui-store.ts` | Add `hasSeenHeroCta` flag for dismissal (optional) |
| `messages/bn.json`, `messages/en.json` | Add `landing.*` keys (most may already exist — verify) |

**Design rules:**
- Use `cn()` for class composition; no inline `style={{...}}` for layout.
- `prettier-plugin-tailwindcss` sorts classes.
- Images from `public/` only; Cloudflare R2 + Google hosts are allowlisted
  (see `next.config.js`).
- Mobile-first; verified at `sm`, `md`, `lg`.
- Lighthouse score targets: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.

**Reuse:** all shadcn primitives + Recharts (if any chart on counters), `useTranslations`
from `next-intl`.

**Verification:**
```bash
pnpm test:e2e -- landing.spec.ts
# Playwright projects: chromium + mobile (Pixel 5) — already configured in playwright.config.ts
# Manual: /bn vs /en — confirm headline, counters, and CTAs are translated.
# Lighthouse:
npx lighthouse http://localhost:3000/bn --view --preset=desktop
npx lighthouse http://localhost:3000/bn --view --preset=mobile
```

**Done when:**
- Bilingual, responsive, fast (LCP < 2.5s on local).
- All CTAs route correctly (or land on `/donate` placeholder).
- Counters load from `/api/public/stats` and gracefully show "—" on error.
- Lighthouse desktop + mobile hit the targets.

---

## 4. Cross-Cutting Concerns

### 4.1 i18n parity CI check (P4)
Add `scripts/i18n-parity-check.mjs`:
- Load both JSON files.
- Diff keys recursively.
- Exit 1 with a clear diff if any key is missing on either side.

### 4.2 Conventional Commits
Already enforced (`.commitlintrc.json` + husky + lint-staged).
Subject ≤ 72 chars, lowercase, no trailing period, imperative. Types: feat, fix, docs,
style, refactor, perf, test, chore, ci, build, revert. Scopes: auth, payment, donation,
i18n, db, ui, api, admin, infra.

### 4.3 Branching (from CONTRIBUTING.md)
- `develop` ← integration target for this round.
- `feat/<scope>-<desc>` / `fix/<scope>-<desc>` / `ci/...`
- Squash-merge into `develop` after CI green.
- `main` left untouched.

### 4.4 Security reporting
`SECURITY.md` — email `riftbond007@users.noreply.github.com` or open GitHub Security Advisory.

---

## 5. Repository Conventions (Authoritative)

- **Path alias:** `@/*` → `./src/*`
- **Strict TS:** `strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`,
  `noFallthroughCasesInSwitch`. ESLint: `no-explicit-any` is **warn**, unused args must
  start with `_`. `no-console` only allows `warn`/`error`.
- **Prettier:** 100 cols, 2 spaces, single quotes, trailing comma es5, LF,
  `prettier-plugin-tailwindcss` for class sorting.
- **Filesystem layout:** flat — no barrel `index.ts` re-exports.
- **shadcn convention:** UI primitives in `src/components/ui/`. Use `cn()` from
  `@/lib/utils` to compose classes.
- **Money:** Prisma `Decimal(10,2)`. Display via `formatBDT()` from `src/lib/utils.ts`.
- **Image hosts allowlist** (next.config.js): `**.googleusercontent.com`,
  `**.r2.cloudflarestorage.com`, `lh3.googleusercontent.com`. Add new hosts only with review.
- **Env loading:** never commit `.env*` (gitignored). `.env.example` is the source of truth.
- **Secrets in audit logs:** `audit.ts` auto-redacts any `details` key matching
  `password|token|secret|apikey|credit_card|cvv`.

---

## 6. Local Dev Quick Reference

```bash
# One-time
pnpm install --frozen-lockfile
cp .env.example .env.local
docker compose -f docker-compose.dev.yml up -d postgres redis
pnpm prisma migrate dev
pnpm prisma:seed    # optional

# Daily
pnpm dev            # http://localhost:3000

# Before commit
pnpm lint
pnpm type-check
pnpm test
pnpm format
```

---

## 7. Open Questions (Blockers)

Can't be answered from code alone — flag for the user:

1. **Admin bootstrap mechanism.** How does the first `ADMIN` user get created?
   Suggested: a Prisma seed step gated by `SEED_ADMIN_EMAIL` env var.
2. **`/api/public/stats`** (new in P5) — does it need caching in Redis? Recommended: yes,
   60s TTL.
3. **Testimonials content** (P5) — placeholder strings OK for now, or do you have real ones?
4. **CI runtime budget** (P4) — what's the max you're willing to wait? Recommend <10 min total.
5. **Lighthouse targets** (P5) — confirm Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95.

---

## 8. Done-Definition for This Plan

- [ ] P1: User profile CRUD works end-to-end; profile-completion gates dashboard.
- [ ] P2: Admin can list/ban users + view reports; non-admin gets 403.
- [ ] P3: Every page renders data from the API; every form persists.
- [ ] P4: `develop` branch shows green CI badge; no deploy job runs.
- [ ] P5: Landing page is bilingual, responsive, fast, all CTAs routed.
- [ ] `pnpm test:cov` ≥80/80/80/75 across all new code.
- [ ] i18n parity check passes (every new string in both locale files).
- [ ] No `console.error` during a full navigation walk-through.
- [ ] All branches squash-merged into `develop`.

---

## 9. Files Index (Critical Paths)

| Path | Purpose |
|---|---|
| `package.json` | pnpm scripts, deps |
| `tsconfig.json` | Strict TS, `@/*` alias |
| `next.config.js` | i18n + headers + image allowlist |
| `tailwind.config.ts` | shadcn tokens + fonts |
| `prisma/schema.prisma` | Data model |
| `src/middleware.ts` | i18n + auth + admin guards |
| `src/i18n.ts` | next-intl config |
| `src/lib/auth/next-auth.ts` | NextAuth config |
| `src/lib/auth/session.ts` | Server-side session helpers |
| `src/lib/prisma.ts` | Singleton Prisma |
| `src/lib/redis.ts` | Singleton Redis |
| `src/lib/audit.ts` | Security event log |
| `src/lib/rate-limit.ts` | Sliding-window limiter |
| `src/lib/api/client.ts` | Fetch wrapper |
| `src/lib/api/helpers.ts` | `withAuth`, `withRole`, `withRateLimit` |
| `src/lib/utils.ts` | `cn()`, `formatBDT()`, `truncate()`, `sleep()` |
| `src/lib/hooks/` | TanStack Query hooks |
| `src/lib/validation/` | Zod schemas |
| `messages/bn.json`, `messages/en.json` | Translations |
| `.github/workflows/ci.yml` | Lint + test + build |
| `.github/workflows/code-quality.yml` | Format + commitlint + i18n parity |
| `scripts/` | CI + ops scripts |

---

*End of plan. Update this file as decisions are made or scope changes.*