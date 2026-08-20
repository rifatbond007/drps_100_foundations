/**
 * Admin users table.
 * SKELETON — fleshed out by admin-agent phase.
 */
'use client';

import { useTranslations } from 'next-intl';

export function UsersTable() {
  const t = useTranslations('admin.users');

  return (
    <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
      {t('title')} — {t('search')}
    </div>
  );
}
