/**
 * Landing hero.
 *
 * Single centred column. Fills the viewport minus the sticky header so
 * the headline lands at the fold on every device height. No side rail,
 * no ledger — the donation CTA is the only action above the fold.
 *
 * The bKash-pink underline accent on the second word is the only
 * chromatic move on the page; everything else is grey-on-paper so the
 * foundation name reads as the headline, not as part of a card stack.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  return (
    <section className="border-b border-border bg-background">
      <div className="container flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center py-12 text-center sm:py-16">
        {/* Foundation name display-set. One short headline and one
         * underline accent — no eyebrow, no subtitle card, no chrome. */}
        <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {t('heroTitle')} <span className="border-b-4 border-bkash pb-1">{t('heroAccent')}</span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t('heroSubtitle')}
        </p>

        <div className="mt-10">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link href={`/${locale}/donate`}>{t('donateCta')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
