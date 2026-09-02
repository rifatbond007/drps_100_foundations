/**
 * Trust / Transparency section.
 *
 * One editorial paragraph in display-weight type — the foundation
 * signing its promise to the donor. Below the paragraph, three
 * hairline-bordered figures: years operating, transactions reviewed,
 * average review time. The figures themselves sign the trust; we
 * don't add a "trusted by 12,000 donors" pill.
 */
import { getTranslations } from 'next-intl/server';

interface Props {
  locale: 'bn' | 'en';
}

export async function TrustSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  // Live figures come from /api/donations/stats on a real deploy.
  const stats = [
    { value: '7', label: t('trustStatYears') },
    { value: '1,247', label: t('trustStatReviewed') },
    { value: '< 4h', label: t('trustStatHours') },
  ];

  return (
    <section className="border-t border-border bg-background">
      <div className="container py-14 sm:py-20">
        <h2 className="mb-8 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('trustSectionTitle')}
        </h2>

        <p className="max-w-3xl text-lg leading-relaxed text-foreground sm:text-xl sm:leading-[1.6]">
          {t('trustBody')}
        </p>

        <dl className="mt-10 grid grid-cols-1 divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="px-2 py-6 first:pl-0 sm:px-6 sm:py-2">
              <dd className="text-4xl font-bold tabular-nums text-foreground sm:text-5xl">
                {s.value}
              </dd>
              <dt className="mt-2 text-xs font-medium text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
