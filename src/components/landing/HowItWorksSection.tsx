/**
 * How it works section.
 *
 * The same 3-step sequence from the hero, expanded with one-clause
 * explanations. Set as a register, not as 3 floating numbered cards.
 * Hairline rules between rows.
 *
 * Number markers 01/02/03 are justified here because the content is
 * genuinely a sequence: pick amount → send via bKash → admin verifies.
 */
import { getTranslations } from 'next-intl/server';

interface Props {
  locale: 'bn' | 'en';
}

export async function HowItWorksSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  const steps = [
    { n: '01', title: t('step1Title'), body: t('howStep1Body') },
    { n: '02', title: t('step2Title'), body: t('howStep2Body'), accent: 'bkash' as const },
    { n: '03', title: t('step3Title'), body: t('howStep3Body') },
  ];

  return (
    <section className="border-t border-border bg-background">
      <div className="container py-14 sm:py-20">
        <h2 className="mb-8 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('howSectionTitle')}
        </h2>

        <ol className="border-y border-border">
          {steps.map((s) => (
            <li
              key={s.n}
              className="grid grid-cols-[3rem_1fr] items-baseline gap-x-6 gap-y-2 border-b border-border py-6 last:border-b-0 sm:grid-cols-[4rem_1fr_2fr]"
            >
              <span
                className={
                  s.accent === 'bkash'
                    ? 'text-2xl font-bold tabular-nums text-bkash sm:text-3xl'
                    : 'text-2xl font-bold tabular-nums text-primary sm:text-3xl'
                }
                aria-hidden="true"
              >
                {s.n}
              </span>
              <div className="col-span-1 sm:col-span-2">
                <p className="text-lg font-semibold text-foreground sm:text-xl">{s.title}</p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
