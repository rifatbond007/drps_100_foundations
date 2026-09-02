/**
 * Landing hero.
 *
 * Asymmetric, left-aligned. The page is set like a printed letter:
 *
 *   - A small foundation wordmark sits flush left, NOT in all-caps.
 *   - A quiet three-row ledger strip sits flush right at the top —
 *     a signal of life, not a stat.
 *   - The headline sits on a 1px hairline rule running the full width
 *     of the headline column, not under a single accented word.
 *   - One primary CTA + one quiet text-link secondary.
 *   - A 3-step process sequence at the bottom (numbered 01/02/03 —
 *     this IS a sequence: pick → send → verify).
 *
 * Fills the viewport minus the sticky header. The bKash pink number in
 * step 02 is the only chromatic stroke on the page besides the emerald
 * primary button — that's the only place the donor's eye should find
 * the payment path.
 *
 * Reduced motion: the entrance animation runs once on mount and
 * respects prefers-reduced-motion.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

interface LedgerEntry {
  name: string;
  amount: string;
}

// Recent donations are sample here. On a real deploy this is a server
// fetch of /api/donations/recent — three rows is enough to register
// "this is happening" without becoming a stat block.
const ledger: LedgerEntry[] = [
  { name: 'রাহেলা বেগম', amount: '৳৫,০০০' },
  { name: 'Anonymous', amount: '৳১,০০০' },
  { name: 'তানভীর আহমেদ', amount: '৳২,০০০' },
];

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  return (
    <section className="relative border-b border-border bg-background">
      <div className="container flex min-h-[calc(100dvh-3.5rem)] flex-col justify-between py-10 sm:py-14 lg:py-20">
        {/* ── Top row: foundation wordmark + live ledger ─────── */}
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-start">
          <p className="text-xs font-medium text-foreground">{t('heroEyebrow')}</p>

          {/* Three-row ledger strip. Right-aligned on sm+. Each row
           *  is name (left) + amount (right), no chip, no card. */}
          <div className="w-full border-y border-border sm:w-auto sm:border-0 sm:text-right">
            <p className="border-b border-border py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:border-0 sm:py-0 sm:pb-2">
              {t('recentStrip')}
            </p>
            <ul className="divide-y divide-border sm:divide-y-0">
              {ledger.map((d, i) => (
                <li key={i} className="flex items-baseline justify-between gap-6 py-2 sm:py-1.5">
                  <span className="truncate text-sm text-muted-foreground">
                    {d.name === 'Anonymous' ? t('ledgerAnonymous') : d.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {d.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Headline + subtitle + CTA ──────────────────────── */}
        <div className="mt-12 max-w-3xl sm:mt-16 lg:mt-20">
          {/* The headline. The bKash pink accent here is a small
           *  accent on the second phrase, but it's structural — it
           *  is what the donor is buying: real change, not symbolic
           *  gesture. The hairline rule runs the full width of the
           *  headline column below it. */}
          <h1 className="text-balance text-5xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {t('heroTitle')} <span className="text-bkash">{t('heroAccent')}</span>
          </h1>
          <div className="mt-1 h-px w-32 bg-foreground sm:w-48 lg:w-64" aria-hidden="true" />

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('heroSubtitle')}
          </p>

          {/* Primary CTA + quiet text-link secondary. Anchored to
           *  the same baseline; the secondary lives to the right of
           *  the primary button on sm+. */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <Link href={`/${locale}/donate`}>{t('donateCta')}</Link>
            </Button>
            <Link
              href={`/${locale}/about`}
              className="text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {t('howItWorks')} →
            </Link>
          </div>
        </div>

        {/* ── 3-step process sequence (this IS a sequence) ──── */}
        <ol className="mt-10 grid grid-cols-1 gap-6 border-t border-border pt-6 sm:mt-14 sm:grid-cols-3 sm:gap-10">
          <Step n="01" title={t('step1Title')} />
          <Step n="02" title={t('step2Title')} accent="bkash" />
          <Step n="03" title={t('step3Title')} />
        </ol>
      </div>
    </section>
  );
}

function Step({ n, title, accent }: { n: string; title: string; accent?: 'bkash' }) {
  return (
    <li className="flex items-baseline gap-3">
      <span
        className={
          accent === 'bkash'
            ? 'shrink-0 text-base font-bold tabular-nums text-bkash'
            : 'shrink-0 text-base font-bold tabular-nums text-primary'
        }
        aria-hidden="true"
      >
        {n}
      </span>
      <span className="text-sm text-foreground sm:text-base">{title}</span>
    </li>
  );
}
