'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/use-auth';

/**
 * Settings page.
 * SKELETON — frontend-agent will wire to /api/users/settings.
 */
export default function SettingsPage() {
  const t = useTranslations('settings');
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [donationReceipts, setDonationReceipts] = useState(true);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profile')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>{t('name')}</Label>
            <div className="text-sm">{user.name ?? '—'}</div>
          </div>
          <div className="space-y-1">
            <Label>{t('email')}</Label>
            <div className="text-sm">{user.email ?? '—'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('notifications')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm">{t('emailNotifications')}</span>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">{t('donationReceipts')}</span>
            <input
              type="checkbox"
              checked={donationReceipts}
              onChange={(e) => setDonationReceipts(e.target.checked)}
            />
          </label>
        </CardContent>
      </Card>

      <Button>{t('saveChanges')}</Button>
    </div>
  );
}