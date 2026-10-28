import { useTranslations } from 'next-intl';
import { LogIn, ReceiptText, Smartphone } from 'lucide-react';
import { SectionHeading } from './section-heading';

const STEPS = [
  { icon: LogIn, title: 'step1Title', body: 'step1Body' },
  { icon: Smartphone, title: 'step2Title', body: 'step2Body' },
  { icon: ReceiptText, title: 'step3Title', body: 'step3Body' },
] as const;

/** Deep-green band: heading on the left, the three steps as a numbered rail on the right. */
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
        <ol className="relative">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative flex gap-6 pb-12 last:pb-0 sm:gap-8">
              {/* Connector to the next step. */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-7 top-16 h-[calc(100%-4.5rem)] w-px bg-gradient-to-b from-emerald-400/60 to-white/10"
                />
              )}
              <span className="tabular flex size-14 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-lg font-bold text-emerald-300">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="pt-2.5">
                <h3 className="flex items-center gap-2.5 text-xl font-semibold">
                  {t(title)}
                  <Icon className="size-5 text-white/40" aria-hidden />
                </h3>
                <p className="mt-2 max-w-md text-white/70">{t(body)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
