/**
 * Causes section — a register of where the money goes.
 *
 * Each row is a cause: number (Bengali ০১) | name | description |
 * raised-so-far. No chips, no card chrome, no icon squares.
 * The causes are the foundation's promises rendered as a list.
 *
 * The descriptive text sits in muted foreground; the raised figure
 * sits in tabular-nums at the right edge — it is the figure the
 * donor is most interested in, so it earns the right of way.
 */
import { getTranslations } from 'next-intl/server';
import { formatBDT } from '@/lib/utils';

interface Props {
  locale: 'bn' | 'en';
}

export async function CausesSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  const causes = [
    {
      n: '০১',
      name: t('causeGeneralName'),
      desc: t('causeGeneralDesc'),
      raised: 42500,
    },
    {
      n: '০২',
      name: t('causeEducationName'),
      desc: t('causeEducationDesc'),
      raised: 38950,
    },
    {
      n: '০৩',
      name: t('causeMedicalName'),
      desc: t('causeMedicalDesc'),
      raised: 28900,
    },
    {
      n: '০৪',
      name: t('causeEmergencyName'),
      desc: t('causeEmergencyDesc'),
      raised: 14500,
    },
  ];

  return (
    <section id="causes" className="border-t border-border bg-background">
      <div className="container py-14 sm:py-20">
        <h2 className="mb-8 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('causesSectionTitle')}
        </h2>

        <ol className="border-y border-border">
          {causes.map((c) => (
            <li
              key={c.n}
              className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-border py-5 last:border-b-0 sm:grid-cols-[3rem_1fr_2rem_1fr_8rem]"
            >
              <span className="text-sm font-semibold tabular-nums text-primary" aria-hidden="true">
                {c.n}
              </span>
              <span className="text-base font-semibold text-foreground sm:text-lg">{c.name}</span>
              {/* Dash separator visible only on sm+ — pure mark of a register */}
              <span aria-hidden="true" className="hidden text-base text-muted-foreground sm:inline">
                —
              </span>
              <span className="col-span-2 text-sm text-muted-foreground sm:col-span-1">
                {c.desc}
              </span>
              <div className="col-span-3 text-right sm:col-span-1">
                <span className="text-base font-bold tabular-nums text-foreground sm:text-lg">
                  {formatBDT(c.raised, locale)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">{t('causeRaised')}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
