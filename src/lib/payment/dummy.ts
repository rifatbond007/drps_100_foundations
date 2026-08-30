/**
 * Dummy / test-only payment provider.
 *
 * Stands in for a real bKash / SSLCOMMERZ / Stripe gateway during local
 * development and end-to-end testing. NO real network calls, NO real
 * money. The "redirect URL" returned points to an in-app /donate/checkout
 * page where the user clicks Pay / Cancel; that page then calls back
 * into our own /api/donations/complete route which updates the donation
 * status (SUCCESS / FAILED).
 *
 * The shape of this client mirrors src/lib/payment/bkash.ts so swapping
 * to a real gateway later is a search-and-replace on the import.
 *
 * Why a fake provider?
 *   - Lets us exercise the full create → redirect → callback → success
 *     flow without external dependencies.
 *   - Lets the test suite seed deterministic payments.
 *   - Lets QA confirm UI states (pending / success / failed) without
 *     burning real money.
 *
 * CRITICAL: this provider is intentionally enabled by default. To force
 * the real (skeleton) bKash client, set PAYMENT_PROVIDER=bkash in .env.
 * The real client is NOT YET IMPLEMENTED — selecting it would surface a
 * 501 from /api/donations/create.
 */
import type { DummyPaymentRequest, DummyPaymentResponse, DummyQueryResponse } from './types';

class DummyPaymentClient {
  /**
   * Generates a fake "payment URL" pointing at our own /donate/checkout
   * page so the user lands on the dummy gateway rendered by the app.
   *
   * The paymentId is derived from donationId so a duplicate createPayment
   * for the same donation returns the same paymentId. This makes the
   * dummy gateway's "Pay" button idempotent against accidental
   * double-submits from the UI.
   */
  async createPayment(req: DummyPaymentRequest): Promise<DummyPaymentResponse> {
    const paymentId = `DUMMY-${req.donationId}`;

    const checkoutPath = `/donate/checkout?paymentId=${encodeURIComponent(
      paymentId
    )}&donationId=${encodeURIComponent(req.donationId)}`;

    return {
      paymentId,
      amount: req.amount.toFixed(2),
      currency: 'BDT',
      redirectUrl: checkoutPath,
      merchantInvoiceNumber: req.donationId,
    };
  }

  /**
   * In a real gateway, NEVER trust the callback — always verify via the
   * provider's Query API. Here the "query" is a no-op that reports
   * Completed; the /donate/checkout page is the source of truth and it
   * mutates the donation directly before the user is redirected back.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async queryPayment(paymentId: string): Promise<DummyQueryResponse> {
    return {
      paymentId,
      status: 'Completed',
      trxId: `DUMMY-TRX-${Date.now()}`,
      amount: '0',
      currency: 'BDT',
      transactionStatus: 'Completed',
    };
  }
}

// Singleton — matches the shape of bkashClient so consumers don't care
// which provider they're using.
export const dummyPaymentClient = new DummyPaymentClient();

/**
 * True when the dummy provider is the active gateway. Useful for
 * callers that want to render "Test mode" banners on the UI.
 */
export function isDummyProvider(): boolean {
  return (process.env.PAYMENT_PROVIDER ?? 'dummy') === 'dummy';
}
