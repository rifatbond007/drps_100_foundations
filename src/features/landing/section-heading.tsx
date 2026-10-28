import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  lead?: string;
  /** Short label above the title. */
  eyebrow?: string;
  align?: 'left' | 'center';
  /** Use on dark bands. */
  inverted?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  lead,
  eyebrow,
  align = 'left',
  inverted = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-10 max-w-2xl sm:mb-12',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'mb-3 text-sm font-semibold uppercase tracking-wider',
            inverted ? 'text-emerald-300' : 'text-primary'
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className="text-balance text-3xl font-bold sm:text-4xl">{title}</h2>
      {lead && (
        <p className={cn('mt-3 text-lg', inverted ? 'text-white/70' : 'text-muted-foreground')}>
          {lead}
        </p>
      )}
    </div>
  );
}
