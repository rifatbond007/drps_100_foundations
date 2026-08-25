/**
 * Avatar primitive — image with initial-letter fallback.
 * Minimal — no Radix dependency. Plain <img> avoids next/image optimizer
 * issues with arbitrary HTTPS image hosts (mirrors UserMenu.tsx pattern).
 */
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-16 w-16 text-2xl',
};

function initialsOf(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || (email && email.trim()) || '';
  return source ? source.slice(0, 1).toUpperCase() : '?';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, email, size = 'md', ...props }, ref) => {
    const [errored, setErrored] = React.useState(false);
    const showImage = src && !errored;

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src ?? undefined}
            alt={name ?? ''}
            onError={() => setErrored(true)}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initialsOf(name, email)}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';
