import { setRequestLocale } from 'next-intl/server';
import { HeroSection } from '@/components/landing/HeroSection';
import { ActivitySection } from '@/components/landing/ActivitySection';
import { CausesSection } from '@/components/landing/CausesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { CtaStripSection } from '@/components/landing/CtaStripSection';

/**
 * /[locale] — the public landing page.
 *
 * Six sections in deliberate order:
 *   1. Hero (split display + live total + bKash bar)
 *   2. Activity (3 figures as one register — heartbeat)
 *   3. Causes (4 rows: number · name · description · raised)
 *   4. How it works (3 steps as a register with explanations)
 *   5. Trust (editorial paragraph + 3 verification figures)
 *   6. CTA strip (the page's only emerald surface)
 *
 * Every section opens with a hairline rule at the page level. Within
 * sections, hairline rules separate rows. No cards, no shadows, no
 * gradients. The bKash pink bar at the bottom of the hero is the
 * page's only saturated chromatic stroke besides the emerald CTA
 * surface at the bottom.
 */
export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const safeLocale: 'bn' | 'en' = locale === 'en' ? 'en' : 'bn';

  return (
    <>
      <HeroSection locale={locale} />
      <ActivitySection locale={safeLocale} />
      <CausesSection locale={safeLocale} />
      <HowItWorksSection locale={safeLocale} />
      <TrustSection locale={safeLocale} />
      <CtaStripSection locale={locale} />
    </>
  );
}
