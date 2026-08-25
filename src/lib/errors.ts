/**
 * Custom error classes.
 * All errors extend AppError so a global handler can detect them.
 *
 * H5: All AppError subclasses expose a `safeMessage` getter that returns a
 * client-safe version (no PII). Server-side `message` may carry sensitive
 * context (bKash error bodies, stack traces). Always log the full message
 * with the `errorId` and only echo `safeMessage` to the client in production.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Override to return a redacted message safe for client transmission.
   * Default: nothing leaks (clients should rely on `code` + `errorId`).
   * Classes that have deliberately client-safe messages can override.
   */
  get safeMessage(): string {
    return 'An error occurred';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
  override get safeMessage(): string {
    return 'You must sign in to continue';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
  override get safeMessage(): string {
    return 'You do not have permission to do that';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
  override get safeMessage(): string {
    return 'Resource not found';
  }
}

export class ValidationError extends AppError {
  constructor(
    message = 'Invalid input',
    public details?: Record<string, unknown>
  ) {
    super(message, 400, 'VALIDATION_ERROR');
  }
  override get safeMessage(): string {
    return this.message; // validation messages are intentionally client-safe
  }
}

export class RateLimitError extends AppError {
  constructor(public retryAfter: Date) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
  }
  override get safeMessage(): string {
    return 'Too many requests. Please try again later.';
  }
}

export class PaymentError extends AppError {
  constructor(
    message: string,
    public providerCode?: string
  ) {
    super(message, 502, 'PAYMENT_ERROR');
  }
  override get safeMessage(): string {
    // Never echo bKash error bodies — they may contain internal txn IDs
    return 'Payment could not be processed. Please try again.';
  }
}
