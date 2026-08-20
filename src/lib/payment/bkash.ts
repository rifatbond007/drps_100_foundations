/**
 * bKash Tokenized Checkout (PGW) API client.
 * Per payment-agent.md. NEVER trust callback data — always verify via Query API.
 *
 * SKELETON: full implementation arrives with payment-agent phase.
 */
import type {
  BKashConfig,
  BKashPaymentRequest,
  BKashPaymentResponse,
  BKashQueryResponse,
  BKashTokenResponse,
} from './types';

class BKashClient {
  private config: BKashConfig;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: BKashConfig) {
    this.config = config;
  }

  private async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    const response = await fetch(`${this.config.baseUrl}/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        username: this.config.username,
        password: this.config.password,
      },
      body: JSON.stringify({
        app_key: this.config.appKey,
        app_secret: this.config.appSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`bKash token grant failed: ${response.status}`);
    }

    const data = (await response.json()) as BKashTokenResponse;
    if (data.statusCode !== '0000') {
      throw new Error(`bKash token error: ${data.statusMessage}`);
    }

    this.token = data.id_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 300) * 1000);
    return this.token!;
  }

  async createPayment(req: BKashPaymentRequest): Promise<BKashPaymentResponse> {
    const token = await this.getToken();
    const response = await fetch(`${this.config.baseUrl}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': this.config.appKey,
      },
      body: JSON.stringify({
        amount: req.amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: req.donationId,
        callbackURL: req.callbackUrl,
      }),
    });

    if (!response.ok) throw new Error(`bKash create payment failed: ${response.status}`);
    const data = (await response.json()) as BKashPaymentResponse;
    if (data.statusCode !== '0000') throw new Error(`bKash create error: ${data.statusMessage}`);
    return data;
  }

  /** CRITICAL: Always verify via Query API — never trust callback data. */
  async queryPayment(paymentId: string): Promise<BKashQueryResponse> {
    const token = await this.getToken();
    const response = await fetch(`${this.config.baseUrl}/payment/query/${paymentId}`, {
      method: 'GET',
      headers: { Authorization: token, 'X-APP-Key': this.config.appKey },
    });
    if (!response.ok) throw new Error(`bKash query failed: ${response.status}`);
    return (await response.json()) as BKashQueryResponse;
  }
}

function makeConfig(): BKashConfig {
  return {
    baseUrl: process.env.BKASH_BASE_URL ?? 'https://tokenized.pay.bka.sh/v1.2.0-beta/sandbox',
    appKey: process.env.BKASH_APP_KEY ?? '',
    appSecret: process.env.BKASH_APP_SECRET ?? '',
    username: process.env.BKASH_USERNAME ?? '',
    password: process.env.BKASH_PASSWORD ?? '',
  };
}

// Singleton
export const bkashClient = new BKashClient(makeConfig());
