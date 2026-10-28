import { useTranslations } from 'next-intl';
import { BarChart3, ScanSearch, UserRoundCheck } from 'lucide-react';
import { SectionHeading } from './section-heading';

const POINTS = [
  { icon: ScanSearch, n: 1 },
  { icon: BarChart3, n: 2 },
  { icon: UserRoundCheck, n: 3 },
] as const;

export function Trust() {
  const t = useTranslations('landing');
  return (
    <section className="container py-20 sm:py-28">
      <SectionHeading eyebrow={t('trustEyebrow')} title={t('trustTitle')} lead={t('trustLead')} />
      <ul className="grid overflow-hidden rounded-xl border bg-card shadow-card max-md:divide-y md:grid-cols-3 md:divide-x">
        {POINTS.map(({ icon: Icon, n }) => (
          <li key={n} className="group p-7 transition-colors hover:bg-primary-soft/50 sm:p-8">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="size-6" aria-hidden />
            </span>
            <h3 className="mt-6 text-lg font-semibold">{t(`trust${n}Title`)}</h3>
            <p className="mt-2 text-muted-foreground">{t(`trust${n}Body`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
