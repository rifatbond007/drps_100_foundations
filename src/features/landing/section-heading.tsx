import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  lead?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({ title, lead, align = 'center' }: SectionHeadingProps) {
  return (
    <div className={cn('mb-10 max-w-2xl sm:mb-12', align === 'center' && 'mx-auto text-center')}>
      <h2 className="text-balance text-3xl font-bold sm:text-4xl">{title}</h2>
      {lead && <p className="mt-3 text-lg text-muted-foreground">{lead}</p>}
    </div>
  );
}
