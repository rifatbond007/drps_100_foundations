import { setRequestLocale } from 'next-intl/server';
import { HeroSection } from '@/components/landing/HeroSection';
import { LandingNav } from '@/components/landing/LandingNav';
import { ActivitySection } from '@/components/landing/ActivitySection';
import { CausesSection } from '@/components/landing/CausesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PeopleSection } from '@/components/landing/PeopleSection';
import { EventsSection } from '@/components/landing/EventsSection';
import { StoriesSection } from '@/components/landing/StoriesSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { CtaStripSection } from '@/components/landing/CtaStripSection';

/**
 * /[locale] — the public landing page.
 *
 * Ten sections in deliberate order:
 *   1. Hero (split display + 01/02/03 register + bKash bar)
 *   2. ─── sticky in-page nav (table of contents) ───
 *   3. Activity (3 figures as one register — heartbeat)
 *   4. Causes (4 rows: number · name · description · raised)
 *   5. How it works (3 steps as a register with explanations)
 *   6. People (3 hairline-framed portraits — the faces)
 *   7. Events (date · title · location · status register)
 *   8. Stories (one display number + editorial paragraph + facts)
 *   9. FAQ (click-to-expand questions in a register)
 *  10. Trust (editorial paragraph + 3 verification figures)
 *  ───  CTA strip (the page's only emerald surface) ───
 *
 * Every section opens with a hairline rule at the page level. Within
 * sections, hairline rules separate rows. No cards, no shadows, no
 * gradients. Three reserved colours: emerald (CTA + active nav
 * underline), bKash pink (hero bar + step 02), admin mustard (people
 * accents + TBA status). The rest is paper and ink.
 *
 * The LandingNav sits between the masthead header and the Activity
 * section. It is sticky and updates its active state as the reader
 * scrolls. Each link uses native smooth scroll to its section id.
 */
export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const safeLocale: 'bn' | 'en' = locale === 'en' ? 'en' : 'bn';

  return (
    <>
      <HeroSection locale={locale} />
      <LandingNav />
      <ActivitySection locale={safeLocale} />
      <CausesSection locale={safeLocale} />
      <HowItWorksSection locale={safeLocale} />
      <PeopleSection locale={safeLocale} />
      <EventsSection locale={safeLocale} />
      <StoriesSection locale={safeLocale} />
      <FaqSection />
      <TrustSection locale={safeLocale} />
      <CtaStripSection locale={locale} />
    </>
  );
}
