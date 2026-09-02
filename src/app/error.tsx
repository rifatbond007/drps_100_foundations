'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Global error boundary. Restrained: a short sentence, a reference code
 * (the digest), and a "Try again" button. No dramatic illustration or
 * apologetic copy.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Something went wrong
      </p>
      <p className="text-base text-foreground">
        We couldn't finish loading this page. Our team has been notified.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">ref: {error.digest}</p>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
