import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';
import { LoginCard } from '@/features/auth/login-card';
import { resolveLoginCallback } from '@/features/auth/login-callback';

/**
 * /[locale]/login — sign-in page. Middleware sends signed-out visitors of
 * protected pages here with `?callbackUrl=`; NextAuth sends failed OAuth
 * round-trips here with `?error=`.
 */
export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { callbackUrl, error } = await searchParams;
  const target = resolveLoginCallback(callbackUrl, locale);

  // Already signed in (and not revoked): skip the card.
  const session = await auth();
  if (session?.user?.id) redirect(target);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_20%,hsl(var(--primary)/0.12),transparent)]"
      />
      <LoginCard callbackUrl={target} error={error} />
    </div>
  );
}
