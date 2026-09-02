/**
 * Landing hero.
 *
 * Composition is deliberately un-ornamented:
 *   - Foundation name display-set in Hind Siliguri, set against a single
 *     bKash-pink underline accent (the only chromatic stroke on the page).
 *   - One headline, one sentence of subtitle, one CTA.
 *   - Below the headline: a recent-donations register — the actual
 *     latest contributions, replacing the AI-tell "trust card" stack of
 *     icons.
 *
 * Trust is communicated by what the foundation actually does, not by
 * floating icons. The TrxID-style register reads as a real ledger; the
 * page no longer needs a "12,000+ donors trust us" pill — the
 * transactions visible below say it better than the eyebrow badge did.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  // Recent donations are sample here; on a real deploy this would be a
  // server fetch of /api/donations/recent. The placeholder list lets the
  // hero render without a database round-trip on the marketing route.
  const recent = [
    { name: 'রাহেলা বেগম', amount: '৳৫,০০০', when: '২ ঘণ্টা আগে' },
    { name: 'Anonymous', amount: '৳১,০০০', when: '৪ ঘণ্টা আগে' },
    { name: 'তানভীর আহমেদ', amount: '৳২,০০০', when: 'গতকাল' },
    { name: 'Anonymous', amount: '৳৫০০', when: '২ দিন আগে' },
    { name: 'সাদিয়া হাসান', amount: '৳১০,০০০', when: '৩ দিন আগে' },
  ];

  return (
    <section className="border-b border-border bg-background">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        {/* ─────────────────────── Left: the ask ─────────────────────── */}
        <div className="flex flex-col justify-center">
          {/* Foundation name in display weight. The single bKash
           * underline accent — one stroke of pink under the last
           * word — is the only chromatic move on the page. */}
          <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t('heroTitle')} <span className="border-b-4 border-bkash pb-1">{t('heroAccent')}</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('heroSubtitle')}
          </p>

          <div className="mt-8">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={`/${locale}/donate`}>{t('donateCta')}</Link>
            </Button>
          </div>
        </div>

        {/* ─────────────────────── Right: ledger ─────────────────────── */}
        <div className="flex flex-col justify-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t('recentHeader')}
          </p>
          <ol className="border-t border-border">
            {recent.map((d, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-4 border-b border-border py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.when}</div>
                </div>
                <div className="shrink-0 font-semibold tabular-nums text-foreground">
                  {d.amount}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">{t('recentFootnote')}</p>
        </div>
      </div>
    </section>
  );
}
