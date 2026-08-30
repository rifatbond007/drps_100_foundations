import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

/**
 * Minimal landing hero. Server component.
 *
 * Intentionally simple: a soft primary gradient backdrop, the headline,
 * the subtitle, and two CTAs. No badges, no trust row, no animated
 * floating shapes — keeps the page focused on a single action.
 *
 * Why min-h-screen: lands at the top of the page and fills the
 * viewport, with the sticky header floating above it.
 */
export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-background"
    >
      {/* Soft primary gradient backdrop — single layer, no blobs, no grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-primary/5 to-background"
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center sm:gap-8 sm:py-32">
        <h1
          id="hero-title"
          className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
        >
          {t('heroTitle')}
        </h1>

        <p className="max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          {t('heroSubtitle')}
        </p>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button asChild size="lg">
            <Link href={`/${locale}/donate`}>{t('donateCta')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/${locale}/about`}>{t('aboutCta')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
