/**
 * Manual bKash payment configuration.
 *
 * Donors send money to the personal bKash number below and then submit
 * the transaction id + sender phone through the donate page. An admin
 * cross-checks the bKash app and approves / rejects from /admin/donations.
 *
 * There is NO automatic gateway integration. No webhook. No query API.
 * The previous bKash Tokenized PGW client was a skeleton and has been
 * removed — the actual integration was never completed and the manual
 * flow is what the org uses today.
 *
 * Keep this number in sync with the foundation's bKash personal account.
 * If the number rotates, update BKASH_RECEIVER_NUMBER on every
 * deployment (Vercel env + .env.local).
 */

export const BKASH_RECEIVER_NUMBER = process.env.BKASH_RECEIVER_NUMBER ?? '01720058533';

/** Display label for the bKash payment instructions shown on /donate. */
export const PAYMENT_INSTRUCTIONS = {
  method: 'bKash (Personal)',
  number: BKASH_RECEIVER_NUMBER,
  referenceHint: 'Use your name or "donation" as the reference',
} as const;

/**
 * Pseudo gateway identifier persisted on Donation.paymentMethod. Keeps
 * the column non-null so admin reports don't have to handle "unknown"
 * rows. If a real gateway is ever wired back in, swap this for the
 * gateway's code (e.g. "bkash_pgw", "sslcommerz", "stripe").
 */
export const PAYMENT_METHOD = 'manual_bkash' as const;
