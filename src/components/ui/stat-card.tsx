import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './card';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, loading, className }: StatCardProps) {
  return (
    <Card className={cn('flex items-start gap-4 p-5', className)}>
      {Icon && (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-24" />
        ) : (
          <p className="tabular mt-1 truncate text-2xl font-bold">{value}</p>
        )}
        {hint && !loading && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}
