import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['amount', 'pay', 'submit', 'done'] as const;

/** Progress through the donation flow. `step` is 1-based. */
export function DonateStepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const t = useTranslations('donation.steps');
  return (
    <ol className="mb-8 flex items-center gap-2">
      {STEPS.map((key, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <li
            key={key}
            className="flex flex-1 items-center gap-2"
            aria-current={current ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                done && 'bg-primary text-primary-foreground',
                current && 'bg-primary-soft text-primary-soft-foreground ring-2 ring-primary',
                !done && !current && 'bg-muted text-muted-foreground'
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : n}
            </span>
            <span
              className={cn(
                'hidden text-sm font-medium lg:inline',
                !current && 'text-muted-foreground'
              )}
            >
              {t(key)}
            </span>
            {n < STEPS.length && <span className="h-px flex-1 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
