import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { ProfileCompletionForm } from '@/components/auth/ProfileCompletionForm';
import { auth } from '@/lib/auth/next-auth';

/**
 * /complete-profile — first-login onboarding.
 *
 * Lives in (requires-auth) NOT (authenticated) on purpose: this page is for
 * users whose profile is incomplete. Putting it under (authenticated) caused
 * an infinite redirect loop (auth layout bounced incomplete users here, this
 * route's layout bounced them right back).
 *
 * Layout above already enforced requireAuth(). Here we additionally short-circuit
 * if the user has somehow already completed their profile.
 */
export default async function CompleteProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth.profileCompletion');
  const session = await auth();

  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.profileCompleted) redirect(`/${locale}/dashboard`);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <ProfileCompletionForm
          defaultLanguage={session.user.languagePref === 'EN' ? 'EN' : 'BN'}
          redirectTo={`/${locale}/dashboard`}
        />
      </div>
    </div>
  );
}
