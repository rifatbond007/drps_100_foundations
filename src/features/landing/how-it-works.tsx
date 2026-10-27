import { useTranslations } from 'next-intl';
import { LogIn, ReceiptText, Smartphone } from 'lucide-react';
import { SectionHeading } from './section-heading';

const STEPS = [
  { icon: LogIn, title: 'step1Title', body: 'step1Body' },
  { icon: Smartphone, title: 'step2Title', body: 'step2Body' },
  { icon: ReceiptText, title: 'step3Title', body: 'step3Body' },
] as const;

export function HowItWorks() {
  const t = useTranslations('landing');
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-muted/50 py-16 sm:py-24">
      <div className="container">
        <SectionHeading title={t('howTitle')} lead={t('howLead')} />
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative rounded-lg border bg-card p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <Icon className="size-5 text-muted-foreground" aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{t(title)}</h3>
              <p className="mt-2 text-muted-foreground">{t(body)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
