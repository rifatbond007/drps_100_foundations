/**
 * Payment provider types.
 *
 * Two providers live here:
 *   1. bKash (real) — full type definitions matching the bKash REST API.
 *      The BKashClient in ./bkash.ts uses these directly.
 *   2. Dummy (test) — a parallel type set used by ./dummy.ts. Mirrors the
 *      real gateway's shape so swapping providers is a search/replace.
 *
 * In the current build, only the Dummy provider is wired into routes.
 * The bKash provider is kept as a skeleton for the eventual real
 * gateway integration (see payment-agent.md).
 */

// ============================================
// Dummy / test provider
// ============================================

export interface DummyPaymentRequest {
  amount: number;
  callbackUrl: string;
  donationId: string;
}

export interface DummyPaymentResponse {
  paymentId: string;
  amount: string;
  currency: string;
  /**
   * URL the client should redirect the user to. For the dummy provider
   * this is an in-app route (/donate/checkout); for a real gateway it
   * would be a third-party URL.
   */
  redirectUrl: string;
  merchantInvoiceNumber: string;
}

export interface DummyQueryResponse {
  paymentId: string;
  status: string;
  trxId: string;
  amount: string;
  currency: string;
  transactionStatus: 'Completed' | 'Failed' | 'Cancelled' | 'Incomplete';
}

// ============================================
// bKash (real, skeleton)
// ============================================

export interface BKashConfig {
  baseUrl: string;
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
}

export interface BKashTokenResponse {
  statusCode: string;
  statusMessage: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface BKashPaymentRequest {
  amount: number;
  callbackUrl: string;
  donationId: string;
}

export interface BKashPaymentResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
}

export interface BKashQueryResponse {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  mode: string;
  paymentCreateTime: string;
  paymentExecuteTime: string;
  amount: string;
  currency: string;
  trxID: string;
  transactionStatus: 'Completed' | 'Failed' | 'Cancelled' | 'Incomplete';
  transactionType: string;
  merchantInvoiceNumber: string;
}

export const BKASH_ERRORS: Record<string, string> = {
  '2001': 'Invalid app key or secret',
  '2002': 'Invalid token',
  '2003': 'Token expired',
  '2004': 'Invalid payment ID',
  '2005': 'Payment already executed',
  '2006': 'Payment not found',
  '2010': 'Invalid amount',
  '2011': 'Invalid currency',
  '2012': 'Invalid callback URL',
  '9999': 'Internal server error',
};

// ============================================
// Provider selection
// ============================================

/**
 * Provider-agnostic facade. Returns the right client based on
 * PAYMENT_PROVIDER env (default "dummy"). Routes should call this
 * instead of importing a concrete client so swapping providers is an
 * env-only change.
 */
export function getPaymentClient() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  if ((process.env.PAYMENT_PROVIDER ?? 'dummy') === 'bkash') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { bkashClient } = require('./bkash');
    return bkashClient;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { dummyPaymentClient } = require('./dummy');
  return dummyPaymentClient;
}
