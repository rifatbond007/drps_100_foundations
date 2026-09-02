/**
 * Stories / Impact section.
 *
 * One editorial outcome rendered as type — not a 3-card grid, not
 * testimonial tiles. The page already has three "people" portraits;
 * adding a 3-up testimonial grid would be the same card pattern
 * dressed differently. Instead, a single outcome block:
 *
 *   - A display-size number that anchors the section (the same
 *     tabular-numeral gesture as Activity, but here it represents
 *     one specific result, not a running tally)
 *   - A short editorial paragraph that gives the number its meaning
 *   - A small ledger of three single-line follow-up facts beneath
 *
 * Restraint: no quotes, no headshots, no carousel arrows. The number
 * carries the section.
 */
import { getTranslations } from 'next-intl/server';

interface Props {
  locale: 'bn' | 'en';
}

export async function StoriesSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  const facts = [
    { n: '০১', label: t('storyFact1') },
    { n: '০২', label: t('storyFact2') },
    { n: '০৩', label: t('storyFact3') },
  ];

  return (
    <section id="stories" className="border-t border-border bg-background">
      <div className="container py-14 sm:py-20">
        <h2 className="mb-10 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('storiesSectionTitle')}
        </h2>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[auto_1fr] lg:gap-16">
          {/* The single anchor number. Set at display size with
           *  tabular-nums. The locale-appropriate script picks the
           *  numeral system automatically via Intl.NumberFormat. */}
          <div>
            <p className="text-6xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              {new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'bn-BD').format(127)}
            </p>
            <p className="mt-3 max-w-xs text-base font-medium text-muted-foreground sm:text-lg">
              {t('storiesFigureCaption')}
            </p>
          </div>

          {/* The editorial paragraph + facts ledger. The paragraph
           *  sits beside the figure on lg+, beneath it on mobile. */}
          <div className="max-w-2xl">
            <p className="text-lg leading-relaxed text-foreground sm:text-xl sm:leading-[1.6]">
              {t('storiesBody')}
            </p>

            <ul className="mt-8 border-y border-border">
              {facts.map((f) => (
                <li
                  key={f.n}
                  className="grid grid-cols-[3rem_1fr] items-baseline gap-x-4 border-b border-border py-4 last:border-b-0"
                >
                  <span
                    aria-hidden="true"
                    className="text-sm font-semibold tabular-nums text-primary"
                  >
                    {f.n}
                  </span>
                  <span className="text-base text-foreground">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
