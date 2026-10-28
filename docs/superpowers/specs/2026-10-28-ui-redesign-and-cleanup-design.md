# UI Redesign + Codebase Cleanup — Design

Date: 2026-10-28
Status: draft, awaiting owner approval

## Intent

The owner considers the current code and folder structure messy and wants the
**entire UI redesigned from scratch**. They approved this direction: replace the
"paper & ink editorial register" look (hairline rules, no cards, off-white
paper) with a **warmer, modern community-donation look**:

- soft rounded cards and surfaces,
- a bold hero with the live donation total front and center,
- clear progress bars per cause,
- photo/portrait-led people and stories sections,
- a proper app-style dashboard for donors and admins,
- emerald green stays the primary colour; bKash pink only on payment surfaces,
- works equally well in Bangla (default) and English.

Success = every page looks like it belongs to one coherent, modern product; the
code is organised so the owner can find things; known bugs are fixed; type-check,
lint, unit tests, and build all pass.

## Scope — three phases, in this order

1. **Cleanup & fixes** (no visual change required) — folder restructure, dead
   code removal, real bug fixes. Gives the redesign a clean base.
2. **UI redesign** — new design system, then every page rebuilt on it.
3. **Verification** — type-check, lint, vitest, `next build`, Playwright E2E
   rewritten to match the new UI, manual browser walk-through of every page in
   both locales and light/dark.

## Non-goals

- No change to the product's behaviour or roles (user / admin as in README).
- No change to the payment model: donations are **manual bKash Send Money +
  TrxID submission, approved by an admin** (that's what the code does today).
  No bKash PGW integration in this project.
- No Prisma schema redesign beyond what a bug fix strictly needs (one new
  unique constraint, see below).
- No new features beyond those listed (blog/alumni stay "coming soon" pages,
  redesigned).

## Anti-goals (would be failure even if it "works")

- Fake numbers shown publicly as if live (today the landing page hardcodes
  totals — must be removed).
- Bangla rendering broken or cramped (Bangla glyphs need more line-height;
  every component must be checked in `bn`).
- bKash pink used for chrome/decoration.
- A redesign that leaves the old components lying around beside the new ones.

## Phase 1 — Cleanup & fixes

### Target folder structure

```
src/
  app/                      routes only — pages/layouts stay thin
    [locale]/
      (marketing)/          landing, about, blog, alumni, login   (was (public) + root page)
      (app)/                dashboard, donate/*, history, settings (was (authenticated))
      admin/                dashboard, users, donations, reports
    api/                    unchanged URLs
  components/
    ui/                     design-system primitives (button, card, input, badge, progress, dialog, table, tabs, stat, empty-state, …)
    layout/                 site-header, site-footer, app-shell (sidebar + topbar), mobile-nav, language-switcher, user-menu, theme-toggle
  features/
    landing/                landing sections
    auth/                   sign-in / sign-out buttons, login card
    donation/               amount picker, purpose picker, bKash instructions, trx form, donation list/item, status badge
    profile/                settings forms
    admin/                  users table, review table, reports panel, totals
  hooks/                    react-query hooks (moved from lib/hooks)
  lib/                      server + shared utilities (prisma, redis, auth, payment, api, validation, i18n, format)
  types/
  i18n.ts → lib/i18n/request.ts
```

- File names: **kebab-case** for all component files (shadcn convention),
  PascalCase exports. (Builder's call to apply consistently.)
- Route URLs must not change (only route-group folder names change).

### Delete (dead or duplicated)

- `components/marketing/PublicNav.tsx`, `components/donation/DonationHistoryList.tsx`
  (replaced by the new feature component), `lib/i18n/utils.ts`,
  `lib/stores/auth-store.ts`, unused `ui/` primitives (replaced by the new set).
- `components/auth/LoginButton.tsx` + `layout/SignInButton.tsx` + three inline
  `signOut` copies → one `SignInButton` and one `SignOutButton` in `features/auth`.
- `ProfileCompletionForm` + `api/users/complete-profile`: the flow was never
  wired. **Decision: delete both** (settings page already edits phone/language);
  delete `lib/validation/profile-completion.ts` and their tests.
- Unused deps: `axios`, `date-fns`, `bcryptjs`, `zustand`, `@sentry/nextjs`
  (and the commented Sentry block). Add `@tailwindcss/typography` only if the
  about page uses `prose`.
- Merge `lib/utils.ts` + `lib/utils/` into `lib/utils/` (or `lib/format.ts` for
  formatting). One `ApiSuccess`/`ApiError` type (in `types/api.ts`). One
  `BD_PHONE_REGEX` in `lib/validation/common.ts`, used everywhere.
- One locale-aware formatting helper (`formatBDT`, `formatNumber`,
  `formatDate`) replacing the repeated `locale === 'en' ? 'en-US' : 'bn-BD'`.

### Bug fixes (from the audit)

1. Single `<html><body>`: only `app/[locale]/layout.tsx` renders it (with
   `lang`, font variable); root layout becomes a passthrough.
2. Remove the extra `export { AdminStatsCard }` from a page file.
3. Middleware: make the matcher exclusion and code agree. API protection lives
   in route handlers (`requireAdmin` / `requireAuth`) — remove the dead API
   branches from middleware rather than widening the matcher (so session
   polling isn't rate-limited). Auth rate limiting for sign-in stays where it
   actually runs.
4. Redirect responses must not copy request headers; cookies set via
   `response.cookies`.
5. Unauthenticated users hitting a protected page go to `/{locale}/login?callbackUrl=<path>`;
   sign-in uses `safe-callback-url` to return them there.
6. Banned/deleted users: middleware treats an empty token as logged out.
7. bKash receiver number: the submit page gets it from the server (server
   component prop or the donation API response), not a client-side env read.
8. TrxID race: add `@unique` on `Donation.trxId` (migration) and handle the
   unique-violation as a 409 "TrxID already used".
9. Approve/reject: conditional update `where: { id, status: 'PENDING' }`;
   0 rows → 409.
10. Idempotency: key generated once per donate-form session, cache key scoped
    by user id, create + payment-id update in one transaction.
11. Malformed JSON / bad query params → 400 via a shared `parseJson` /
    zod query parsing helper.
12. Audit log only records 5xx / unexpected errors, not every `AppError`.
13. `lib/redis.ts` must not throw at import; fail lazily with a logged error.
14. Landing totals come from a **new public endpoint** `GET /api/public/stats`
    (approved-donation total, donor count, per-purpose totals), cached in
    Redis ~60s. No hardcoded "live" figures anywhere.
15. Dashboard uses `totalDonated`/counts from `/api/users/profile`; history
    page gets pagination (load-more).
16. Smaller: consistent redirect target for admin/app layouts; `/login` shows
    a login card with a button (no auto-redirect to Google); drop
    `prompt: 'consent'`; report date buckets in `Asia/Dhaka`; admin totals
    show an error state; theme preference actually applied (via `next-themes`);
    `/api/health?deep=1` returns only ok/fail per dependency, no raw error
    text; submit-trx redirect uses the current locale.
17. All user-facing strings go through `messages/{bn,en}.json` (including
    not-found/error pages, aria-labels, metadata titles, client error
    fallbacks). Server error messages map to i18n keys on the client.

## Phase 2 — UI redesign

### Design system

- **Colour:** emerald primary (keep hue ~#0E7A5A family, slightly brighter for
  modern feel), warm neutral backgrounds (near-white, not beige paper), soft
  emerald tint for highlight surfaces, bKash pink `#E2136E` only on the
  pay/submit button and bKash instruction card, amber for "pending" status,
  red for destructive/failed. Admin area gets no separate mustard chrome —
  instead a small "Admin" badge in the shell (builder's call to refine).
- **Light + dark** themes, both first-class; tokens as CSS variables.
- **Shape:** radius 12–16px on cards, full-pill buttons/chips, soft shadows
  (`shadow-sm` level), generous spacing.
- **Type:** keep **Hind Siliguri** (covers Bangla + Latin, already loaded) for
  everything; bigger display sizes on hero/stat numbers; line-height ≥1.6 for
  Bangla body text.
- **Icons:** lucide-react (already a dependency).
- **Motion:** subtle — hover lift on cards, count-up on the hero total,
  progress-bar fill on scroll into view; respect `prefers-reduced-motion`.
- **Primitives** (in `components/ui`, shadcn-style on Radix where needed):
  button (primary, secondary, ghost, outline, bkash, destructive; sizes),
  card, input, textarea, select, label, badge (status variants), progress,
  avatar, dialog, dropdown-menu, tabs, table, skeleton, toast, stat-card,
  empty-state, page-header.

### Pages

**Marketing shell:** sticky translucent top bar (logo, Home/About/Blog/Alumni,
language switcher, theme toggle, Sign in / Donate CTA), mobile slide-over menu,
rich footer (about blurb, links, contact, bKash notice).

**Landing (`/[locale]`)**, top to bottom:

1. Hero — headline + subcopy, primary "Donate now" + secondary "How it works",
   big **live total raised** card (real data from `/api/public/stats`) with
   donor count.
2. Causes — 4 cards (one per `DonationPurpose`): icon, name, description,
   amount raised (real per-purpose totals), progress bar toward a goal.
   Goals are static config in `lib/config/causes.ts` (placeholder values the
   owner edits).
3. How it works — 3 steps (sign in with Google → send via bKash → submit TrxID,
   admin verifies) as numbered cards.
4. People — the 3 existing portraits as photo cards (name, role).
5. Events — upcoming events as cards with date block and status badge (content
   stays static, from messages).
6. Stories — featured story card with image placeholder + quote.
7. FAQ — accordion.
8. Trust — transparency points (manual verification, reports, receipts).
9. Final CTA banner (emerald gradient surface).

The old sticky in-page section nav is dropped.

**Login:** centered card with logo, short welcome, "Continue with Google"
button, error message area, link back home.

**App shell (donor + admin):** left sidebar on desktop (collapsible to icons),
bottom/slide-over nav on mobile, top bar with page title, language switcher,
theme toggle, user menu (avatar, settings, sign out). Admin links appear in the
same shell for admins, under an "Admin" group.

**Donor pages:**

- Dashboard — greeting, stat cards (total donated, donations count, pending
  count), "Donate again" CTA card, recent donations list with status badges.
- Donate — step indicator (1 Amount & cause → 2 Pay via bKash → 3 Submit
  TrxID → Done); amount presets + custom amount, cause cards selectable, summary.
- Donate/submit — bKash instruction card (number with copy, amount, reference),
  TrxID + sender phone form.
- Donate/pending — success/pending state illustration, reference, links.
- History — filterable list/table (status tabs), status badges, load-more.
- Settings — sectioned cards: Profile, Preferences (language, theme),
  Notifications.

**Admin pages:** Dashboard (stat cards + charts preview + quick links),
Users (search, filters, table with ban/unban via confirm dialog), Donations
review (pending queue cards/table, approve, reject with note dialog), Reports
(stat cards, recharts bar/line themed to the new palette, CSV export).

**Error / not-found:** branded, localized, with "go home" button.

## Phase 3 — Verification

- `pnpm install`, `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build` all
  pass.
- Unit tests for deleted components removed; tests for new/changed logic
  (stats endpoint, conditional approve/reject, TrxID uniqueness, idempotency,
  callbackUrl) added or updated.
- Playwright E2E rewritten to match the new UI (role/testid selectors, not
  copy), covering: landing renders in bn/en, protected route → login with
  callbackUrl, login page shows Google button.
- Manual walk-through with Playwright screenshots of every page at mobile and
  desktop width, bn and en, light and dark.

## Delivery

- Work on a feature branch (`feat/ui-redesign`), commits per phase/step
  (Conventional Commits), PR to `main` at the end. Owner merges.

## Calls made by the designer (owner to check)

- **TrxID uniqueness:** partial unique index (raw SQL migration) on `trxId`
  for rows whose status is not `FAILED`/`CANCELLED`, so a rejected TrxID can be
  resubmitted. Before the migration, a script `scripts/check-duplicate-trx.ts`
  lists any existing duplicates; the migration is not deployed until that list
  is empty (duplicates resolved by an admin, never auto-deleted).
- **Public stats:** total raised = sum of `SUCCESS` donations; donors =
  distinct users with ≥1 `SUCCESS` donation; banned/deleted users' approved
  donations still count (the money was received). Per-purpose totals the same
  way. Cached 60s.
- **Theme:** `next-themes` drives the UI. For a signed-in user, the DB value is
  applied once on load; changing the toggle while signed in writes it back via
  `PUT /api/users/settings`. Signed out: local only.

- **Images:** no real photos supplied. Ship designed placeholders (existing
  `public/images/people/portrait-*.svg` + a new story placeholder) rendered via
  `next/image`, swappable by replacing files in `public/images/`.
- **Notification/receipt toggles:** nothing sends email, so they are removed
  from the Settings UI (DB columns and API stay untouched). Settings keeps
  Profile + Preferences (language, theme).

Status: approved by owner 2026-10-28 ("yes go").

## Left to the builder

- Exact token values, spacing scale, component APIs, chart styling.
- Copy edits needed to fit the new layout (both locales, kept equivalent).
- Whether a given list is a table or card list on each breakpoint.
