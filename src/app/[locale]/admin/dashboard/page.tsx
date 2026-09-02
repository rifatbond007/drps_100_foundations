import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { AdminTotalsLive } from '@/components/admin/AdminTotalsLive';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';

/**
 * /admin/dashboard — landing page for admins.
 *
 * Top: live totals row (Total users / Total raised / Today).
 * Below: a list of quick links as text with arrows. No "shortcut card"
 * with an icon square + title + description — admin tools are utility
 * surfaces, not marketing surfaces.
 */
export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const safeLocale: 'bn' | 'en' = locale === 'en' ? 'en' : 'bn';
  const t = await getTranslations('admin.dashboard');

  const links = [
    { href: `/${locale}/admin/users`, title: t('manageUsers') },
    { href: `/${locale}/admin/donations`, title: t('reviewDonations') },
    { href: `/${locale}/admin/reports`, title: t('viewReports') },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
      </header>

      <AdminTotalsLive locale={safeLocale} />

      <nav>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('quickLinks')}
        </h2>
        <ul className="border-t border-border">
          {links.map((l) => (
            <li key={l.href} className="border-b border-border">
              <Link
                href={l.href}
                className="flex items-center justify-between py-3 text-sm text-foreground hover:text-primary"
              >
                <span>{l.title}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

// `AdminStatsCard` is still re-exported for backwards-compat with tests
// that imported it from this module path.
export { AdminStatsCard };
