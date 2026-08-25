/**
 * Browser-side API client (fetch wrapper).
 * Auth is via HTTP-only cookie (NextAuth) — no manual token handling.
 *
 * H9 (audit fix): returns the discriminated `ApiResponse<T>` envelope;
 * throws `ApiClientError` on `success === false`. Callers must check for
 * the envelope shape explicitly OR use the typed helpers below.
 *
 * IMPORTANT: All `/api/*` routes are NOT locale-prefixed — they live at
 * the app root. When the user is on `/bn/dashboard` (or any locale path),
 * a relative `fetch('/api/users/profile')` resolves to
 * `/bn/api/users/profile` because the browser uses the current path as
 * the base URL. That 404s, even though the route exists at
 * `/api/users/profile`. We pin every request to `window.location.origin`
 * to keep API calls off the locale prefix.
 */
import type { ApiResponse } from '@/types/api';
import { ApiClientError } from './errors';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean>;
  body?: unknown;
}

/**
 * Resolve a possibly-relative `path` to an absolute URL rooted at the
 * current origin. Strips any leading locale prefix from the supplied path
 * so callers that mistakenly pass `/bn/api/foo` still hit `/api/foo`.
 */
function resolveApiUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // Normalize: strip the leading locale segment if present (bn|en).
  const stripped = path.replace(/^\/(bn|en)(?=\/api\/)/, '');
  const withApi = stripped.startsWith('/api/')
    ? stripped
    : `/api${stripped.startsWith('/') ? '' : '/'}${stripped}`;
  return `${origin}${withApi}`;
}

/**
 * Returns the raw envelope. Use when you need to inspect `success`.
 */
async function requestEnvelope<T>(path: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
  const { params, body, ...init } = options;

  let url = resolveApiUrl(path);
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
    url += `?${qs.toString()}`;
  }

  const headers = new Headers(init.headers);
  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Best-effort parse — envelope may be malformed on 5xx
  let parsed: ApiResponse<T> | null = null;
  try {
    parsed = (await response.json()) as ApiResponse<T>;
  } catch {
    // Not JSON — synthesize an envelope-shaped error
    if (!response.ok) {
      throw new ApiClientError(`HTTP ${response.status}`, {
        status: response.status,
        code: 'HTTP_ERROR',
      });
    }
    throw new ApiClientError('Invalid JSON response from server', {
      status: response.status,
      code: 'PARSE_ERROR',
    });
  }

  if (parsed.success === false) {
    throw ApiClientError.fromEnvelope(response.status, parsed);
  }
  if (!response.ok) {
    throw new ApiClientError(`HTTP ${response.status}`, {
      status: response.status,
      code: 'HTTP_ERROR',
    });
  }
  return parsed;
}

// Type-narrowing helper used internally — assertion is sound because
// requestEnvelope either returns a success envelope or throws.
function assertSuccess<T>(env: ApiResponse<T>): asserts env is { success: true; data: T } {
  if (env.success !== true) {
    throw new ApiClientError('Unexpected non-success envelope after validation', {
      status: 500,
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * Returns `data` directly, throwing `ApiClientError` on any failure.
 * Most callers want this.
 */
async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const envelope = await requestEnvelope<T>(path, options);
  assertSuccess(envelope);
  return envelope.data;
}

export const apiClient = {
  get: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

/** Escape hatch for callers that want to handle the envelope themselves. */
export const apiClientRaw = {
  request: requestEnvelope,
};
