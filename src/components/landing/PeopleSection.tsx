/**
 * People section — the faces behind the foundation.
 *
 * Three hairline-framed portrait registers. Each frame is a tall 4:5
 * box (portrait orientation) followed by a caption row that mirrors
 * the cause-row layout: a small role label on the left, the name on
 * the right in display weight.
 *
 * Restraint, matching the rest of the page:
 *   - No rounded card chrome. The portrait frame is a hairline rule,
 *     the same device used by the activity / causes / trust rows.
 *   - No chip, no badge, no social handle. The name and role are the
 *     caption. That's it.
 *   - The section's only chromatic accent is the small mustard mark
 *     already drawn inside each portrait SVG (pin / collar / tie) —
 *     admin mustard, which is the page's third reserved colour and
 *     the right hue for "the people who run this". Emerald and bKash
 *     pink stay where they are; this section is mustard on paper.
 *   - A short editorial paragraph above the frames answers the only
 *     question a donor has at this point in the scroll: who, exactly,
 *     is signing the receipts?
 */
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

interface Props {
  locale: 'bn' | 'en';
}

export async function PeopleSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  const people = [
    {
      n: '০১',
      src: '/images/people/portrait-1.svg',
      name: t('people1Name'),
      role: t('people1Role'),
    },
    {
      n: '০২',
      src: '/images/people/portrait-2.svg',
      name: t('people2Name'),
      role: t('people2Role'),
    },
    {
      n: '০৩',
      src: '/images/people/portrait-3.svg',
      name: t('people3Name'),
      role: t('people3Role'),
    },
  ];

  return (
    <section id="people" className="border-t border-border bg-background">
      <div className="container py-14 sm:py-20">
        <h2 className="mb-3 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('peopleSectionTitle')}
        </h2>
        <p className="mb-10 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t('peopleSectionLead')}
        </p>

        <ol className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
          {people.map((p) => (
            <li key={p.n} className="flex flex-col">
              {/* Portrait frame: a single hairline-bordered box in
                  portrait (4:5) orientation. No rounded corners, no
                  shadow, no gradient. */}
              <div className="relative aspect-[4/5] w-full overflow-hidden border border-border bg-[hsl(40,25%,96%)]">
                <span
                  aria-hidden="true"
                  className="absolute left-3 top-3 z-10 text-xs font-semibold tabular-nums text-primary"
                >
                  {p.n}
                </span>
                <Image
                  src={p.src}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>

              {/* Caption: hairline-divided register row beneath the
                  frame. Role on the left in muted-foreground small
                  caps, name on the right in display weight. Mirrors
                  the cause-row layout intentionally — this is a
                  foundation roster, not a SaaS team page. */}
              <div className="mt-0 grid grid-cols-1 gap-1 border-x border-b border-border px-4 py-4 sm:px-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {p.role}
                </p>
                <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {p.name}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
