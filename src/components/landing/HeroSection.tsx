import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  BadgeCheck,
  ScrollText,
  Heart,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

/**
 * Landing hero. Server component.
 *
 * Composition:
 *   - Two-column on ≥lg: left = eyebrow badge + headline + highlight pill
 *     + single primary CTA. Right = a "trust card" stacked over a soft
 *     accent panel, listing the three trust signals with icons.
 *   - Single-column on <lg: left column first, trust card below.
 *
 * Single CTA — "Donate now" is the only decision the page asks for.
 * Removing the secondary "Learn more" button eliminates the choice and
 * keeps the focal point clean. The PublicNav already exposes About, so
 * users who want to read more have an obvious path.
 *
 * Sizing: targets the 90vh content area set by the locale layout. The
 * section uses `h-full` so `items-center` resolves against the full
 * viewport content column, and the inner grid is vertically centered.
 */
export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  return (
    <section
      aria-labelledby="hero-title"
      className="flex h-full w-full items-center justify-center bg-background"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-16">
        {/* ───────────────────────── Left: pitch ───────────────────────── */}
        <div className="flex flex-col items-start text-left">
          {/*
            Eyebrow badge. Sits above the headline as a small trust
            signal — the donor count is the "social proof" that earns
            the headline its weight. Inline-flex so the pill hugs its
            content; ring-1 keeps the border crisp on the muted surface.
          */}
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t('heroBadge')}
          </span>

          {/*
            Headline. `text-balance` evens out the line breaks so the
            second line isn't noticeably shorter than the first — this
            matters because the headline is the dominant element on
            the page.
          */}
          <h1
            id="hero-title"
            className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            {t('heroTitle')}
          </h1>

          <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('heroSubtitle')}
          </p>

          {/*
            Highlight pill. Echoes the eyebrow's rounded shape but uses
            a stronger surface (bg-foreground/5 + ring) so it reads as
            a value-prop statement rather than a tag.
          */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground/5 px-4 py-2 text-sm font-medium text-foreground ring-1 ring-foreground/10">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('heroHighlight')}
          </div>

          {/*
            Single primary CTA. Right-arrow affordance signals forward
            motion; rounded-full matches the navbar pill controls so
            the page reads as one visual system. `shadow-lg` is
            intentional at the focal point only — the trust card on
            the right stays shadow-free so the CTA is unambiguously
            the primary action.
          */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="group h-12 rounded-full px-7 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25"
            >
              <Link href={`/${locale}/donate`}>
                {t('donateCta')}
                <ArrowRight
                  className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
        </div>

        {/* ───────────────────────── Right: trust card ───────────────────────── */}
        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          {/*
            Soft accent panel behind the card. Slightly offset down/right
            so the card appears to float — same trick Tailwind UI uses
            for "stacked" marketing sections. Uses bg-primary/8 (defined
            in the page palette) so the two panels share a hue family
            without competing.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-primary/10"
          />

          {/*
            Trust card. border + bg-card so it pops on the white section;
            shadow-xl lifts it above the accent panel behind. Inside: a
            short header + three labeled rows with Lucide icons. Each row
            has its own subtle separator via divide-y on the list.
          */}
          <div className="relative rounded-3xl border bg-card p-6 shadow-xl sm:p-8">
            <div className="flex items-center gap-3">
              {/*
                Heart icon in a tinted square — anchors the card with a
                warm, donor-centric focal point instead of duplicating
                one of the row icons below. Paired with the eyebrow's
                Sparkles so the page reads as one continuous motif.
              */}
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Heart className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t('trustBadges.secure')}</p>
                <p className="text-xs text-muted-foreground">{t('heroHighlight')}</p>
              </div>
            </div>

            <div className="my-5 h-px bg-border" aria-hidden="true" />

            <ul className="divide-y divide-border">
              <TrustRow
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                label={t('trustBadges.secure')}
              />
              <TrustRow
                icon={<BadgeCheck className="h-4 w-4" aria-hidden="true" />}
                label={t('trustBadges.verified')}
              />
              <TrustRow
                icon={<ScrollText className="h-4 w-4" aria-hidden="true" />}
                label={t('trustBadges.transparent')}
              />
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Single row inside the trust card. Pure presentational — receives the
 * icon + label from the parent so the parent controls the layout and
 * spacing rhythm. Hover state matches the navbar link hover so the
 * trust card doesn't feel like an isolated widget.
 */
function TrustRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-3 py-3 text-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="font-medium text-foreground">{label}</span>
    </li>
  );
}
