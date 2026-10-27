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
    <section className="container py-16 sm:py-24">
      <SectionHeading title={t('trustTitle')} lead={t('trustLead')} />
      <ul className="grid gap-5 md:grid-cols-3">
        {POINTS.map(({ icon: Icon, n }) => (
          <li key={n} className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
              <Icon className="size-6" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold">{t(`trust${n}Title`)}</h3>
              <p className="mt-1 text-muted-foreground">{t(`trust${n}Body`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
