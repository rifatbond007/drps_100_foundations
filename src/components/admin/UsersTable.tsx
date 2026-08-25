/**
 * Admin users management table.
 *
 * Features:
 *   - Debounced live search (email OR name)
 *   - Role filter, banned filter
 *   - Pagination (prev/next)
 *   - Ban / Unban (with reason dialog)
 *   - Optimistic UI updates with rollback on failure
 *   - Inline error toast on failure
 *
 * The "make admin / remove admin" toggle was deliberately removed — role
 * changes are too sensitive for a one-click button and admins are now
 * promoted exclusively through the ADMIN_EMAILS allowlist in the signIn
 * callback (src/lib/auth/next-auth.ts). Manually demoting in-DB remains
 * possible via a manual UPDATE if needed.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Ban, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import { ApiClientError } from '@/lib/api/errors';
import { cn, formatBDT } from '@/lib/utils';

type Role = 'USER' | 'ADMIN';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  isBanned: boolean;
  bannedAt: string | null;
  bannedReason: string | null;
  languagePref: 'BN' | 'EN';
  profileCompleted: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  donationCount: number;
  totalDonated: string;
}

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ListResponse {
  users: AdminUser[];
  pagination: PageMeta;
}

const ALL = '__all__';

function useDebounce<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function UsersTable() {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('admin.users.toasts');

  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [banned, setBanned] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);

  const debouncedQ = useDebounce(q, 300);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, role, banned]);

  const params = useMemo(
    () => ({
      ...(debouncedQ ? { q: debouncedQ } : {}),
      ...(role ? { role } : {}),
      ...(banned ? { banned } : {}),
      page,
      limit: 20,
    }),
    [debouncedQ, role, banned, page]
  );

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<ListResponse>('/api/admin/users', { params });
      setData(result);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserLocally = (id: string, patch: Partial<AdminUser>) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            users: prev.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
          }
        : prev
    );
  };

  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const withOptimistic = useCallback(
    async (
      id: string,
      patch: Partial<AdminUser>,
      request: () => Promise<unknown>,
      successMsg: string,
      errorMsg: string
    ) => {
      setBannerError(null);
      setBannerSuccess(null);
      const prev = data?.users.find((u) => u.id === id);
      updateUserLocally(id, patch);
      try {
        await request();
        setBannerSuccess(successMsg);
        setTimeout(() => setBannerSuccess(null), 3000);
      } catch (e) {
        // rollback
        if (prev) updateUserLocally(id, prev);
        const msg = e instanceof ApiClientError ? e.message : 'Unknown error';
        setBannerError(errorMsg + msg);
        setTimeout(() => setBannerError(null), 5000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  const onBan = async (user: AdminUser, reason: string) => {
    await withOptimistic(
      user.id,
      { isBanned: true, bannedAt: new Date().toISOString(), bannedReason: reason },
      () =>
        apiClient.post(`/api/admin/users/${user.id}/ban`, {
          reason,
        }),
      tCommon('banned'),
      tCommon('error', { message: '' }).replace(': ', '')
    );
  };

  const onUnban = async (user: AdminUser) => {
    await withOptimistic(
      user.id,
      { isBanned: false, bannedAt: null, bannedReason: null },
      () => apiClient.delete(`/api/admin/users/${user.id}/unban`),
      tCommon('unbanned'),
      tCommon('error', { message: '' }).replace(': ', '')
    );
  };

  return (
    <Card>
      {/* Page heading is rendered by the admin page so we don't duplicate
          "User management" + "All registered users" twice on the screen. */}
      <CardContent className="space-y-4 pt-6">
        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pl-9"
              aria-label={t('search')}
            />
          </div>
          <Select value={role || ALL} onValueChange={(v) => setRole(v === ALL ? '' : (v as Role))}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder={t('role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('role')}: —</SelectItem>
              <SelectItem value="USER">{t('roles.USER')}</SelectItem>
              <SelectItem value="ADMIN">{t('roles.ADMIN')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={banned || ALL}
            onValueChange={(v) => setBanned(v === ALL ? '' : (v as 'true' | 'false'))}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('status')}: —</SelectItem>
              <SelectItem value="false">{t('statuses.active')}</SelectItem>
              <SelectItem value="true">{t('statuses.banned')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Banners */}
        {bannerSuccess && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {bannerSuccess}
          </div>
        )}
        {bannerError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {bannerError}
          </div>
        )}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t('viewProfile')}</th>
                <th className="px-4 py-3">{t('role')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3 text-right">{t('totalDonated')}</th>
                <th className="px-4 py-3">{t('joinedAt')}</th>
                <th className="px-4 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    …
                  </td>
                </tr>
              )}
              {data?.users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    {t('empty')}
                  </td>
                </tr>
              )}
              {data?.users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar url={u.avatarUrl} name={u.name} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{u.name || '—'}</div>
                        <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    {u.isBanned ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        {t('statuses.banned')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        {t('statuses.active')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatBDT(u.totalDonated)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {u.isBanned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUnban(u)}
                          disabled={loading}
                          aria-label={t('unban')}
                        >
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                          {t('unban')}
                        </Button>
                      ) : (
                        <BanDialog
                          user={u}
                          onConfirm={(reason) => onBan(u, reason)}
                          disabled={loading}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('pagination.page', {
                page: data.pagination.page,
                total: data.pagination.totalPages,
              })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                {t('pagination.prev')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages || loading}
              >
                {t('pagination.next')}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
      )}
    >
      {role}
    </span>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  if (url) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-8 w-8 rounded-full object-cover"
        />
      </>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
      {initial}
    </div>
  );
}

interface BanDialogProps {
  user: AdminUser;
  onConfirm: (reason: string) => void;
  disabled?: boolean;
}

function BanDialog({ user, onConfirm, disabled }: BanDialogProps) {
  const t = useTranslations('admin.users.banDialog');
  const tConfirm = useTranslations('admin.users.confirm');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const reasonError = reason.trim().length > 0 && reason.trim().length < 10;
  const canSubmit = reason.trim().length >= 10 && !disabled;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-label={t('title')}
      >
        <Ban className="mr-1 h-3.5 w-3.5" />
        {t('title')}
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ban-dialog-title"
        >
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h2 id="ban-dialog-title" className="text-lg font-semibold">
              {t('title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
            <p className="mt-3 text-sm font-medium">
              {tConfirm('ban', { name: user.name || user.email })}
            </p>
            <div className="mt-3 space-y-2">
              <Label htmlFor="ban-reason">{t('reasonLabel')}</Label>
              <textarea
                id="ban-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reasonPlaceholder')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {reasonError && (
                <p className="text-xs text-destructive">{t('reasonLabel')}: 10+ chars</p>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setReason('');
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                disabled={!canSubmit}
                onClick={() => {
                  onConfirm(reason.trim());
                  setOpen(false);
                  setReason('');
                }}
              >
                {t('confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
