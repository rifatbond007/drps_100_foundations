/**
 * bKash PGW API type definitions.
 * Per payment-agent.md.
 */
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
