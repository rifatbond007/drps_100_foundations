/**
 * Skeleton primitive — animated placeholder used while loading.
 * Mirrors the shadcn/ui API but minimal (no Radix dependency).
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
