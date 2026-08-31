'use client';

/**
 * Admin donation review table.
 *
 * Powers /admin/donations. Shows donor-submitted bKash TrxIDs and the
 * actions to approve (→ SUCCESS) or reject (→ FAILED + reason).
 *
 * Optimistic UI: when the admin clicks Approve/Reject the row vanishes
 * immediately. If the API call fails we restore the row + show a toast.
 * Avoids the "stuck spinner while waiting for refetch" problem.
 */
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api/client';
import { ApiClientError } from '@/lib/api/errors';
import { cn, formatBDT } from '@/lib/utils';

type StatusFilter = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

interface DonorLite {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface AdminDonation {
  id: string;
  userId: string | null;
  amount: string;
  currency: string;
  purpose: string;
  status: StatusFilter;
  isAnonymous: boolean;
  trxId: string | null;
  senderPhone: string | null;
  trxSubmittedAt: string | null;
  reviewedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  donor: DonorLite | null;
}

interface AdminListResponse {
  donations: AdminDonation[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function DonationsReviewTable() {
  const t = useTranslations('admin.donations');
  const tCommon = useTranslations('common');
  const tHistory = useTranslations('history');
  const locale = useLocale();
  const langPref = (locale === 'en' ? 'EN' : 'BN') as 'BN' | 'EN';

  const [status, setStatus] = useState<StatusFilter>('PENDING');
  const [items, setItems] = useState<AdminDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-row action state for the inline note dialog.
  const [noteFor, setNoteFor] = useState<{ id: string; action: 'reject' } | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<AdminListResponse>('/admin/donations', {
        params: { status },
      });
      setItems(data.donations);
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : 'Failed to load';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  // Auto-clear toasts after a short delay.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const approve = async (id: string) => {
    setActing(id);
    const snapshot = items;
    setItems((rows) => rows.filter((r) => r.id !== id));
    try {
      await apiClient.post(`/admin/donations/${id}/approve`, {});
      setToast({ kind: 'ok', text: t('toasts.approved') });
    } catch (e) {
      setItems(snapshot); // restore
      const msg = e instanceof ApiClientError ? e.message : String(e);
      setToast({ kind: 'err', text: t('toasts.error', { message: msg }) });
    } finally {
      setActing(null);
    }
  };

  const reject = async (id: string, note: string) => {
    setActing(id);
    const snapshot = items;
    setItems((rows) => rows.filter((r) => r.id !== id));
    try {
      await apiClient.post(`/admin/donations/${id}/reject`, { adminNote: note });
      setToast({ kind: 'ok', text: t('toasts.rejected') });
    } catch (e) {
      setItems(snapshot); // restore
      const msg = e instanceof ApiClientError ? e.message : String(e);
      setToast({ kind: 'err', text: t('toasts.error', { message: msg }) });
    } finally {
      setActing(null);
      setNoteFor(null);
      setNoteDraft('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">{t('filterPending')}</SelectItem>
            <SelectItem value="SUCCESS">{t('filterApproved')}</SelectItem>
            <SelectItem value="FAILED">{t('filterRejected')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'rounded-md border p-3 text-sm',
            toast.kind === 'ok' && 'border-green-200 bg-green-50 text-green-800',
            toast.kind === 'err' && 'border-red-200 bg-red-50 text-red-800'
          )}
        >
          {toast.text}
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {tCommon('loading')}
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('empty')}
          </CardContent>
        </Card>
      )}

      <ul className="space-y-2">
        {items.map((d) => {
          const isRejecting = noteFor?.id === d.id;
          return (
            <li key={d.id}>
              <Card>
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={d.donor?.avatarUrl ?? null}
                        name={d.donor?.name ?? null}
                        email={d.donor?.email ?? null}
                        size="md"
                      />
                      <div>
                        <div className="font-medium">
                          {d.isAnonymous ? t('anonymous') : (d.donor?.name ?? '—')}
                        </div>
                        {!d.isAnonymous && d.donor?.email && (
                          <div className="text-xs text-muted-foreground">{d.donor.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatBDT(d.amount, (locale === 'en' ? 'en' : 'bn') as 'bn' | 'en')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tHistory(`purposes.${d.purpose}`)}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('trxId')}
                      </div>
                      <div className="font-mono">{d.trxId ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('senderPhone')}
                      </div>
                      <div className="font-mono">{d.senderPhone ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('submittedAt')}
                      </div>
                      <div>
                        {d.trxSubmittedAt
                          ? new Date(d.trxSubmittedAt).toLocaleString(
                              langPref === 'EN' ? 'en-US' : 'bn-BD'
                            )
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {isRejecting && (
                    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                      <label className="text-xs font-medium">{t('noteLabel')}</label>
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        placeholder={t('rejectDescription')}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNoteFor(null);
                            setNoteDraft('');
                          }}
                          disabled={acting === d.id}
                        >
                          {t('cancel')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => reject(d.id, noteDraft.trim())}
                          disabled={acting === d.id || noteDraft.trim().length === 0}
                        >
                          {t('reject')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isRejecting && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approve(d.id)}
                        disabled={acting === d.id}
                        className="gap-1"
                      >
                        <Check className="h-4 w-4" />
                        {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNoteFor({ id: d.id, action: 'reject' });
                          setNoteDraft('');
                        }}
                        disabled={acting === d.id}
                        className="gap-1"
                      >
                        <X className="h-4 w-4" />
                        {t('reject')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
