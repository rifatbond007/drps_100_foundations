import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * 404 page. A small number + a sentence + one button. No illustration,
 * no decorative ornament — the page reads as a single sentence that
 * got lost.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-5xl font-bold tabular-nums text-foreground">404</p>
      <p className="text-base text-foreground">The page you were looking for is not here.</p>
      <Button asChild>
        <Link href="/bn">Return home</Link>
      </Button>
    </div>
  );
}
