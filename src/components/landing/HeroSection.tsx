/**
 * Landing hero — pass two.
 *
 * Two bold moves, both typographic:
 *
 *   1. The headline is a split display. The noun ("Your donation,")
 *      fills the column at 7xl-9xl in display weight. The verb
 *      ("in motion.") sits directly below it at 3xl-4xl in light
 *      weight with loosened tracking. The contrast is size + weight,
 *      not colour — this is the move the previous hero was missing.
 *
 *   2. The top-right corner carries a single live total in tabular
 *      numerals, set larger than any other body text on the page. It
 *      is the visual anchor on the right edge. No chip, no card, no
 *      eyebrow — just a small label and a number, hairline-divided
 *      from the foundation wordmark on the left.
 *
 * Restraint:
 *   - No motion. No orchestrated reveal. The number renders at its
 *     final value on first paint.
 *   - The bKash pink appears in exactly two places: the "send to"
 *     destination inside step 02, and a single 4px bar at the very
 *     bottom of the hero. That bar is the page's only saturated
 *     chromatic stroke — the donor's eye lands on it and follows it
 *     to the payment path on the next page.
 *   - The 01/02/03 sequence is compressed into a single register
 *     line. Numbers sit to the left of each label, not above it.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  return (
    <section className="relative flex min-h-[calc(100dvh-3.5rem)] flex-col border-b border-border bg-background">
      {/* ── Top strip: foundation ID (left) · live total (right) ──
       *  Hairline rules separate this row from the hero body above
       *  and below. The total is the strongest piece of typography
       *  on the page besides the headline — it carries the right
       *  edge of the layout. */}
      <div className="border-b border-border">
        <div className="container flex items-baseline justify-between gap-6 py-3">
          <p className="text-sm font-medium tracking-tight text-foreground">{t('heroEyebrow')}</p>
          <div className="flex items-baseline gap-3 text-right">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {t('heroLiveLabel')}
            </span>
            <span className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
              ৳5,000
            </span>
          </div>
        </div>
      </div>

      {/* ── Hero body: split headline + subtitle + CTA ─────────── */}
      <div className="container flex flex-1 flex-col justify-center py-14 sm:py-20 lg:py-24">
        {/* Split display. The first line is the noun, full-width at
         *  display size. The second line is the verb, smaller and
         *  lighter, with loosened tracking and a quiet ink-colour
         *  period at the end. The two lines together are the
         *  visual object — they are NOT a sentence to be parsed. */}
        <h1 className="max-w-5xl">
          <span className="block text-5xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-8xl xl:text-9xl">
            {t('heroHeadlineL1')}
          </span>
          <span className="mt-2 block text-3xl font-light leading-[1.1] tracking-wide text-foreground/80 sm:text-4xl lg:text-5xl">
            {t('heroHeadlineL2')}
          </span>
        </h1>

        {/* A short hairline that sits flush with the headline — the
         *  same gesture that ended the previous hero, refined. It
         *  visually signs the headline as a single object. */}
        <div className="mt-8 h-px w-24 bg-foreground sm:w-32" aria-hidden="true" />

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t('heroSubtitle')}
        </p>

        {/* Primary CTA + quiet text-link secondary. The secondary
         *  shares the CTA's baseline; the primary has no arrow. */}
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Button asChild size="lg" className="h-14 px-10 text-base">
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

      {/* ── Bottom register: 3-step process on a hairline row ──── */}
      <div className="border-t border-border">
        <ol className="container flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
          <Step n="01" title={t('step1Title')} />
          <Step n="02" title={t('step2Title')} accent="bkash" />
          <Step n="03" title={t('step3Title')} />
        </ol>
      </div>

      {/* The page's only saturated pink stroke. A single 4px
       *  horizontal bar pinned to the bottom edge of the hero,
       *  full-width. It's the colour signal that the payment path
       *  lives below the fold. */}
      <div aria-hidden="true" className="h-1 w-full bg-bkash" />
    </section>
  );
}

/** A single step in the bottom register. Number sits inline to the
 *  left of the label; on mobile each step is its own row separated
 *  by a hairline. */
function Step({ n, title, accent }: { n: string; title: string; accent?: 'bkash' }) {
  return (
    <li className="flex items-baseline gap-3 py-4 sm:flex-1 sm:py-5">
      <span
        className={
          accent === 'bkash'
            ? 'shrink-0 text-sm font-semibold tabular-nums text-bkash'
            : 'shrink-0 text-sm font-semibold tabular-nums text-primary'
        }
        aria-hidden="true"
      >
        {n}
      </span>
      <span className="text-sm text-foreground sm:text-base">{title}</span>
    </li>
  );
}
