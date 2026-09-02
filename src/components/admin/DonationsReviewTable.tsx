/**
 * Admin donation review table.
 *
 * Powers /admin/donations: rows of pending donations, each with the
 * donor + TrxID + sender phone + submitted-at as labels on a register.
 * Status is a single uppercase eyebrow above the donate info; approve
 * and reject buttons are hairline-outlined.
 *
 * Approve/Reject uses optimistic UI — the row vanishes immediately, we
 * restore on API failure. Inline error toast at the top.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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

const FILTERS: StatusFilter[] = ['PENDING', 'SUCCESS', 'FAILED'];

export function DonationsReviewTable() {
  const t = useTranslations('admin.donations');
  const tCommon = useTranslations('common');
  const tHistory = useTranslations('history');
  const locale = useLocale();

  const [status, setStatus] = useState<StatusFilter>('PENDING');
  const [items, setItems] = useState<AdminDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteFor, setNoteFor] = useState<{ id: string } | null>(null);
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

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const approve = async (id: string) => {
    setActing(id);
    const snapshot = items;
    setItems((rows) => rows.filter((r) => r.id !== id));
    try {
      await apiClient.post(`/admin/donations/${id}/approve`, {});
      setToast({ kind: 'ok', text: t('toasts.approved') });
    } catch (e) {
      setItems(snapshot);
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
      setItems(snapshot);
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
      {/* Status filter as a row of pills, not a dropdown */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatus(f)}
            aria-pressed={status === f}
            className={cn(
              'h-8 border px-3 text-xs font-medium transition-colors',
              status === f
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:border-foreground'
            )}
          >
            {t(`filter${f.charAt(0)}${f.slice(1).toLowerCase()}`)}
          </button>
        ))}
      </div>

      {toast && (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            'border-l-2 px-3 py-2 text-sm',
            toast.kind === 'ok'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-destructive bg-destructive/5 text-destructive'
          )}
        >
          {toast.text}
        </p>
      )}

      {loading && (
        <p className="py-10 text-center text-sm text-muted-foreground">{tCommon('loading')}</p>
      )}

      {error && !loading && (
        <p className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">{t('empty')}</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ol className="border-t border-border">
          {items.map((d) => {
            const isRejecting = noteFor?.id === d.id;
            const donorName = d.isAnonymous ? t('anonymous') : (d.donor?.name ?? '—');
            return (
              <li key={d.id} className="border-b border-border py-4">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-baseline">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {donorName}
                    </p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                      {formatBDT(d.amount, (locale === 'en' ? 'en' : 'bn') as 'bn' | 'en')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tHistory(`purposes.${d.purpose}`)}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {d.trxSubmittedAt
                      ? new Date(d.trxSubmittedAt).toLocaleString(
                          locale === 'en' ? 'en-US' : 'bn-BD'
                        )
                      : '—'}
                  </time>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                  <Pair label={t('trxId')} value={d.trxId ?? '—'} mono />
                  <Pair label={t('senderPhone')} value={d.senderPhone ?? '—'} mono />
                </dl>

                {isRejecting && (
                  <div className="mt-3 space-y-2 border-l-2 border-destructive bg-destructive/5 px-3 py-2">
                    <label className="text-xs font-medium">{t('noteLabel')}</label>
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      rows={2}
                      className="w-full border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder={t('rejectDescription')}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNoteFor(null);
                          setNoteDraft('');
                        }}
                        disabled={acting === d.id}
                        className="inline-flex h-9 items-center border border-input bg-background px-3 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(d.id, noteDraft.trim())}
                        disabled={acting === d.id || noteDraft.trim().length === 0}
                        className="inline-flex h-9 items-center bg-destructive px-3 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
                      >
                        {t('reject')}
                      </button>
                    </div>
                  </div>
                )}

                {!isRejecting && status === 'PENDING' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => approve(d.id)}
                      disabled={acting === d.id}
                      className="inline-flex h-9 items-center bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {t('approve')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNoteFor({ id: d.id });
                        setNoteDraft('');
                      }}
                      disabled={acting === d.id}
                      className="inline-flex h-9 items-center border border-input bg-background px-3 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                    >
                      {t('reject')}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Pair({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn('text-sm', mono && 'font-mono tabular-nums')}>{value}</dd>
    </div>
  );
}
