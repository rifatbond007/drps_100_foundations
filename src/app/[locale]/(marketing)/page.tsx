import { setRequestLocale } from 'next-intl/server';
import { getPublicStats, type PublicStats } from '@/lib/stats';
import { logger } from '@/lib/logger';
import { toAppLocale } from '@/lib/format';
import { Hero } from '@/features/landing/hero';
import { Causes } from '@/features/landing/causes';
import { HowItWorks } from '@/features/landing/how-it-works';
import { People } from '@/features/landing/people';
import { Events } from '@/features/landing/events';
import { Stories } from '@/features/landing/stories';
import { Faq } from '@/features/landing/faq';
import { Trust } from '@/features/landing/trust';
import { CtaBanner } from '@/features/landing/cta-banner';

// Public figures refresh at most once a minute.
export const revalidate = 60;

async function loadStats(): Promise<PublicStats | null> {
  try {
    return await getPublicStats();
  } catch (error) {
    // Hide the figures rather than show zeros or a broken page.
    logger.warn(
      { err: error instanceof Error ? error.message : String(error) },
      'landing: stats unavailable'
    );
    return null;
  }
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = toAppLocale(raw);
  const stats = await loadStats();

  return (
    <>
      <Hero />
      <Causes stats={stats} locale={locale} />
      <HowItWorks />
      <People />
      <Events locale={locale} />
      <Stories />
      <Faq />
      <Trust />
      <CtaBanner locale={locale} />
    </>
  );
}
