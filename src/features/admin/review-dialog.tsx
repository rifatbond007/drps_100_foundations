'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CircleAlert } from 'lucide-react';
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
import { formatBDT, toAppLocale } from '@/lib/format';
import { apiErrorKey } from '@/lib/i18n/error-message';

interface ReviewDialogProps {
  mode: 'approve' | 'reject';
  donation: { id: string; amount: string; trxId: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the request settles (success or conflict) so the list refetches. */
  onDone: () => void;
}

export function ReviewDialog({ mode, donation, open, onOpenChange, onDone }: ReviewDialogProps) {
  const locale = toAppLocale(useLocale());
  const t = useTranslations('admin.donations');
  const tRoot = useTranslations();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isReject = mode === 'reject';

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiClient.post(
        `/admin/donations/${donation.id}/${mode}`,
        isReject ? { adminNote: note.trim() } : {}
      );
      toast.success(t(isReject ? 'toasts.rejected' : 'toasts.approved'));
      onOpenChange(false);
      setNote('');
      onDone();
    } catch (err) {
      setError(tRoot(apiErrorKey(err)));
      // A conflict means the list is stale; refresh it behind the dialog.
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('cancel')}>
        <DialogHeader>
          <DialogTitle>{t(isReject ? 'rejectTitle' : 'approveTitle')}</DialogTitle>
          <DialogDescription>
            {isReject
              ? t('rejectDescription')
              : t('approveDescription', {
                  trxId: donation.trxId ?? '—',
                  amount: formatBDT(donation.amount, locale),
                })}
          </DialogDescription>
        </DialogHeader>
        {isReject && (
          <Field label={t('noteLabel')} htmlFor="review-note">
            <Textarea
              id="review-note"
              value={note}
              maxLength={500}
              placeholder={t('notePlaceholder')}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        )}
        {error && (
          <p
            role="alert"
            className="flex gap-2 rounded-md bg-destructive-soft p-3 text-sm text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant={isReject ? 'destructive' : 'primary'}
            loading={busy}
            disabled={isReject && note.trim().length === 0}
            onClick={confirm}
          >
            {t(isReject ? 'reject' : 'approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
