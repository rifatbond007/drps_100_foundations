/**
 * Live activity section — the foundation's heartbeat rendered as type.
 *
 * Not a 3-card grid. One continuous register with three columns
 * separated by vertical hairlines (no gaps-and-padding). Each
 * column carries the same structure: a small label, a display-size
 * tabular number, a one-line caption.
 *
 * The numbers are deliberately big — this is the visual anchor that
 * follows the hero's split display. Three numbers as one rhythm.
 */
import { getTranslations } from 'next-intl/server';
import { formatBDT } from '@/lib/utils';

interface Props {
  locale: 'bn' | 'en';
}

export async function ActivitySection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  // Live numbers come from /api/donations/recent on a real deploy.
  // Hard-coded here so the page renders without a database round-trip
  // on the marketing route.
  const today = 5000;
  const lifetime = 124850;
  const pending = 3;

  return (
    <section className="border-t border-border bg-background">
      <div className="container py-14 sm:py-20">
        <h2 className="mb-8 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('activitySectionTitle')}
        </h2>

        <div className="grid grid-cols-1 divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Cell label={t('activityToday')} value={formatBDT(today, locale)} />
          <Cell label={t('activityLifetime')} value={formatBDT(lifetime, locale)} />
          <Cell
            label={t('activityReviewing')}
            value={pending.toLocaleString(locale === 'en' ? 'en-US' : 'bn-BD')}
            accent="admin"
          />
        </div>
      </div>
    </section>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: 'admin' }) {
  return (
    <div className="px-2 py-6 first:pl-0 sm:px-6 sm:py-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={
          accent === 'admin'
            ? 'mt-3 text-4xl font-bold tabular-nums text-admin sm:text-5xl'
            : 'mt-3 text-4xl font-bold tabular-nums text-foreground sm:text-5xl'
        }
      >
        {value}
      </p>
    </div>
  );
}
