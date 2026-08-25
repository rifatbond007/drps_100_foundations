import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';

/**
 * Requires-auth layout — for routes that need login but NOT profile-completed.
 * Currently only /complete-profile lives here. Login + ban checks only.
 *
 * Critically: this layout does NOT redirect to /complete-profile when
 * profileCompleted is false, which would otherwise create an infinite loop
 * (the layout re-firing for that route itself).
 */
export default async function RequiresAuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Hard guard: banned users cannot use any requires-auth route
  if (session.user.isBanned) {
    redirect(`/${locale}/login?error=AccessDenied`);
  }

  return <>{children}</>;
}
