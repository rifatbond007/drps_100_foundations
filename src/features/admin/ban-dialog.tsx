'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import { apiErrorKey } from '@/lib/i18n/error-message';
import type { AdminUser } from '@/hooks/use-admin';

const MIN_REASON = 10;

/** Ban (with a required reason) or unban a user. */
export function BanDialog({
  user,
  onClose,
  onDone,
}: {
  user: AdminUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('admin.users');
  const tRoot = useTranslations();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const unban = user.isBanned;
  const name = user.name ?? user.email;

  const confirm = async () => {
    setBusy(true);
    try {
      if (unban) await apiClient.delete(`/admin/users/${user.id}/unban`);
      else await apiClient.post(`/admin/users/${user.id}/ban`, { reason: reason.trim() });
      toast.success(t(unban ? 'toasts.unbanned' : 'toasts.banned'));
      onDone();
      onClose();
    } catch (err) {
      toast.error(tRoot(apiErrorKey(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent closeLabel={t('banDialog.cancel')}>
        <DialogHeader>
          <DialogTitle>{t(unban ? 'unbanDialog.title' : 'banDialog.title', { name })}</DialogTitle>
          <DialogDescription>
            {t(unban ? 'unbanDialog.description' : 'banDialog.description')}
          </DialogDescription>
        </DialogHeader>
        {!unban && (
          <Field
            label={t('banDialog.reasonLabel')}
            htmlFor="ban-reason"
            hint={t('banDialog.reasonHint')}
          >
            <Textarea
              id="ban-reason"
              value={reason}
              maxLength={500}
              placeholder={t('banDialog.reasonPlaceholder')}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('banDialog.cancel')}
          </Button>
          <Button
            variant={unban ? 'primary' : 'destructive'}
            loading={busy}
            disabled={!unban && reason.trim().length < MIN_REASON}
            onClick={confirm}
          >
            {t(unban ? 'unbanDialog.confirm' : 'banDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
