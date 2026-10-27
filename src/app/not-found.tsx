import Link from 'next/link';

/**
 * Fallback 404 for URLs outside any locale. Localized 404s live in
 * `app/[locale]/not-found.tsx`; this one only points back into the app.
 */
export default function RootNotFound() {
  return (
    <html lang="bn">
      <body className="flex min-h-screen items-center justify-center bg-background font-sans text-foreground">
        <Link href="/bn" className="underline underline-offset-4">
          দান প্ল্যাটফর্ম · Donation Platform
        </Link>
      </body>
    </html>
  );
}
