import { useTranslations } from 'next-intl';
import { GivingSteps } from './giving-steps';
import { SectionHeading } from './section-heading';

const STEPS = [
  { title: 'step1Title', body: 'step1Body' },
  { title: 'step2Title', body: 'step2Body' },
  { title: 'step3Title', body: 'step3Body' },
] as const;

/** Deep-green band: heading on the left, the steps along a scroll-drawn 3D path on the right. */
export function HowItWorks() {
  const t = useTranslations('landing');
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-20 overflow-hidden bg-[hsl(162_45%_9%)] py-20 text-white sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-emerald-500/20 blur-3xl"
      />
      <div className="container relative grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-20">
        <SectionHeading
          eyebrow={t('howEyebrow')}
          title={t('howTitle')}
          lead={t('howLead')}
          inverted
          className="mb-0 sm:mb-0 lg:sticky lg:top-28 lg:self-start"
        />
        <GivingSteps steps={STEPS.map((k) => ({ title: t(k.title), body: t(k.body) }))} />
      </div>
    </section>
  );
}
