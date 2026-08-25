# Backend Planning Guide

**Project:** Donation Platform (School Organization)
**Framework:** Next.js 15 API Routes + TypeScript
**Last Updated:** August 20, 2026

---

## 1. Backend Architecture

### 1.1 Tech Stack

| Layer      | Technology              | Purpose                |
| ---------- | ----------------------- | ---------------------- |
| Runtime    | Node.js 20 LTS          | JavaScript runtime     |
| Framework  | Next.js 15 (API Routes) | Server-side endpoints  |
| Language   | TypeScript              | Type safety            |
| ORM        | Prisma                  | Database queries       |
| Database   | PostgreSQL 16           | Primary data store     |
| Cache      | Redis 7                 | Session, rate limiting |
| Validation | Zod                     | Schema validation      |
| Auth       | NextAuth.js v5          | Authentication         |
| Payment    | bKash PGW API           | Payment processing     |
| Logging    | Pino                    | Structured logging     |
| Email      | Nodemailer + SendGrid   | Transactional emails   |
| Storage    | Cloudflare R2           | File storage           |
| Monitoring | Sentry                  | Error tracking         |

---

## 2. API Design

### 2.1 API Structure

```
/api/
├── auth/
│   └── [...nextauth]/route.ts        # NextAuth handlers
├── donations/
│   ├── create/route.ts               # POST: Create donation
│   ├── callback/route.ts             # GET: bKash callback
│   ├── webhook/route.ts              # POST: bKash webhook
│   ├── verify/route.ts               # POST: Verify payment
│   └── history/route.ts              # GET: User donation history
├── users/
│   ├── profile/route.ts              # GET/PUT: User profile
│   ├── settings/route.ts             # GET/PUT: User settings
│   ├── avatar/route.ts               # POST: Upload avatar
│   └── complete-profile/route.ts     # POST: Complete profile
├── admin/
│   ├── users/
│   │   ├── route.ts                  # GET: List users
│   │   ├── [id]/route.ts             # GET: User details
│   │   ├── [id]/ban/route.ts         # POST: Ban user
│   │   └── [id]/unban/route.ts       # POST: Unban user
│   ├── reports/
│   │   ├── overview/route.ts         # GET: Overview stats
│   │   ├── donations/route.ts        # GET: Donation reports
│   │   └── export/route.ts           # GET: Export CSV
│   └── audit-logs/route.ts           # GET: Audit logs
├── organizations/
│   ├── route.ts                      # GET/PUT: Org info
│   └── stats/route.ts                # GET: Public stats
├── webhooks/
│   └── bkash/route.ts                # POST: bKash webhook
└── health/route.ts                   # GET: Health check
```

---

## 3. API Endpoints Specification

### 3.1 Authentication Endpoints

#### `POST /api/auth/signin`

**Purpose:** Initiate Google OAuth flow

**Request:** None (handled by NextAuth)

**Response:** Redirect to Google OAuth

---

#### `GET /api/auth/callback/google`

**Purpose:** Handle Google OAuth callback

**Flow:**

1. Receive OAuth code from Google
2. Exchange code for user info
3. Create/update user in database
4. Create JWT session
5. Redirect to dashboard

**Response:** Redirect to `/dashboard` or `/complete-profile`

---

#### `POST /api/auth/signout`

**Purpose:** Sign out user

**Response:**

```json
{
  "success": true
}
```

---

### 3.2 Donation Endpoints

#### `POST /api/donations/create`

**Purpose:** Initiate a new donation

**Authentication:** Required

**Request Body:**

```json
{
  "amount": 500,
  "purpose": "general_fund",
  "isAnonymous": false,
  "idempotencyKey": "uuid-v4"
}
```

**Validation (Zod):**

```typescript
const createDonationSchema = z.object({
  amount: z.number().min(10).max(100000),
  purpose: z.enum(['general_fund', 'education', 'medical', 'emergency']),
  isAnonymous: z.boolean(),
  idempotencyKey: z.string().uuid(),
});
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "donationId": "don_123",
    "paymentUrl": "https://bka.sh/payment/...",
    "bkashTransactionId": "BKS123456"
  }
}
```

**Error Responses:**

- `400` — Invalid input
- `401` — Unauthorized
- `429` — Rate limit exceeded
- `500` — Payment gateway error

**Side Effects:**

- Create donation record (status: pending)
- Call bKash Create Payment API
- Log audit event

---

#### `GET /api/donations/callback`

**Purpose:** Handle bKash redirect callback

**Query Parameters:**

- `paymentID` (bKash payment ID)
- `status` (success/failure/cancel)

**Flow:**

1. Receive callback from bKash
2. **Independently verify via bKash Query API** (never trust callback)
3. Update donation status
4. Redirect to success/failure page

**Response:** Redirect to `/donate/success` or `/donate/failed`

---

#### `POST /api/donations/webhook`

**Purpose:** Handle bKash webhook notifications

**Authentication:** Webhook signature verification

**Request Body:**

```json
{
  "paymentID": "BKS123456",
  "status": "Completed",
  "amount": "500",
  "trxID": "BKS123456789"
}
```

**Flow:**

1. Verify webhook signature
2. Verify payment status via bKash Query API
3. Update donation record
4. Send confirmation email
5. Return 200 OK

**Security:**

- Verify HMAC signature
- Check idempotency (duplicate webhooks)
- Log all webhook events

---

#### `GET /api/donations/history`

**Purpose:** Get user's donation history

**Authentication:** Required

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status` (optional: pending|success|failed)
- `startDate` (optional)
- `endDate` (optional)

**Response:**

```json
{
  "success": true,
  "data": {
    "donations": [
      {
        "id": "don_123",
        "amount": 500,
        "currency": "BDT",
        "status": "success",
        "purpose": "general_fund",
        "transactionId": "BKS123456",
        "createdAt": "2026-08-20T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 3.3 User Endpoints

#### `GET /api/users/profile`

**Purpose:** Get current user profile

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://...",
    "phone": "+8801712345678",
    "role": "user",
    "languagePref": "bn",
    "profileCompleted": true,
    "createdAt": "2026-01-15T..."
  }
}
```

---

#### `PUT /api/users/profile`

**Purpose:** Update user profile

**Authentication:** Required

**Request Body:**

```json
{
  "phone": "+8801712345678",
  "languagePref": "en"
}
```

**Validation:**

```typescript
const updateProfileSchema = z.object({
  phone: z.string().regex(/^\+8801[3-9]\d{8}$/),
  languagePref: z.enum(['bn', 'en']),
});
```

**Response:**

```json
{
  "success": true,
  "data": {/* updated user */}
}
```

---

#### `POST /api/users/avatar`

**Purpose:** Upload user avatar

**Authentication:** Required

**Request:** multipart/form-data with image file

**Validation:**

- File type: image/jpeg, image/png, image/webp
- File size: max 2MB
- Dimensions: min 100x100, max 2000x2000

**Flow:**

1. Validate file
2. Upload to Cloudflare R2
3. Update user avatar_url
4. Return new URL

**Response:**

```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://r2.example.com/avatars/user_123.jpg"
  }
}
```

---

#### `POST /api/users/complete-profile`

**Purpose:** Complete profile after first login

**Authentication:** Required

**Request Body:**

```json
{
  "phone": "+8801712345678",
  "languagePref": "bn"
}
```

**Validation:**

- Phone must be valid BD number
- Language preference required

**Response:**

```json
{
  "success": true,
  "data": {/* updated user */}
}
```

---

### 3.4 Admin Endpoints

#### `GET /api/admin/users`

**Purpose:** List all users (admin only)

**Authentication:** Required (admin role)

**Query Parameters:**

- `page`, `limit`
- `search` (name, email, phone)
- `status` (active|banned)
- `sortBy` (createdAt, name, totalDonated)
- `order` (asc, desc)

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "name": "John Doe",
        "email": "user@example.com",
        "phone": "+8801712345678",
        "role": "user",
        "isBanned": false,
        "totalDonated": 5000,
        "donationCount": 10,
        "createdAt": "2026-01-15T..."
      }
    ],
    "pagination": {/* ... */}
  }
}
```

---

#### `POST /api/admin/users/[id]/ban`

**Purpose:** Ban a user

**Authentication:** Required (admin role)

**Request Body:**

```json
{
  "reason": "Violation of terms"
}
```

**Flow:**

1. Update user status (isBanned: true)
2. Invalidate all user sessions
3. Log audit event
4. Send notification email

**Response:**

```json
{
  "success": true,
  "data": {/* updated user */}
}
```

---

#### `GET /api/admin/reports/overview`

**Purpose:** Get overview statistics

**Authentication:** Required (admin role)

**Query Parameters:**

- `startDate`, `endDate`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalDonations": 1500,
    "totalAmount": 750000,
    "averageDonation": 500,
    "successRate": 98.5,
    "topDonors": [
      {
        "userId": "user_123",
        "name": "John Doe",
        "totalDonated": 50000
      }
    ],
    "donationsByDay": [{ "date": "2026-08-20", "count": 50, "amount": 25000 }]
  }
}
```

---

#### `GET /api/admin/audit-logs`

**Purpose:** View audit logs

**Authentication:** Required (admin role)

**Query Parameters:**

- `page`, `limit`
- `userId`, `action`, `startDate`, `endDate`

**Response:**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_123",
        "userId": "user_123",
        "action": "DONATION_CREATED",
        "details": { "amount": 500 },
        "ipAddress": "192.168.1.1",
        "createdAt": "2026-08-20T..."
      }
    ],
    "pagination": {/* ... */}
  }
}
```

---

### 3.5 Health Check

#### `GET /api/health`

**Purpose:** Health check endpoint

**Authentication:** None

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-08-20T10:30:00Z",
  "services": {
    "database": "up",
    "redis": "up",
    "bkash": "up"
  },
  "version": "1.0.0"
}
```

**Checks:**

- Database connection
- Redis connection
- bKash API reachability
- Disk space
- Memory usage

---

## 4. Database Schema

### 4.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum DonationStatus {
  PENDING
  SUCCESS
  FAILED
  CANCELLED
}

enum DonationPurpose {
  GENERAL_FUND
  EDUCATION
  MEDICAL
  EMERGENCY
}

enum Language {
  BN
  EN
}

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String
  avatarUrl       String?
  phone           String?
  role            UserRole @default(USER)
  languagePref    Language @default(BN)
  isBanned        Boolean  @default(false)
  bannedAt        DateTime?
  bannedReason    String?
  profileCompleted Boolean  @default(false)
  emailVerified   DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastLoginAt     DateTime?

  // Relations
  donations       Donation[]
  sessions        Session[]
  auditLogs       AuditLog[]
  settings        UserSettings?

  @@index([email])
  @@index([role])
  @@index([createdAt])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  sessionToken String   @unique
  expires      DateTime
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expires])
}

model Donation {
  id                  String           @id @default(cuid())
  userId              String
  amount              Decimal          @db.Decimal(10, 2)
  currency            String           @default("BDT")
  purpose             DonationPurpose
  status              DonationStatus   @default(PENDING)
  isAnonymous         Boolean          @default(false)
  bkashPaymentId      String?          @unique
  bkashTransactionId  String?          @unique
  paymentMethod       String?          @default("bkash")
  failureReason       String?
  metadata            Json?
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  completedAt         DateTime?

  user                User             @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([bkashPaymentId])
}

model Organization {
  id              String   @id @default(cuid())
  name            String
  descriptionBn   String   @db.Text
  descriptionEn   String   @db.Text
  logoUrl         String?
  goalAmount      Decimal  @db.Decimal(12, 2)
  raisedAmount    Decimal  @default(0) @db.Decimal(12, 2)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([isActive])
}

model UserSettings {
  id                  String   @id @default(cuid())
  userId              String   @unique
  emailNotifications  Boolean  @default(true)
  donationReceipts    Boolean  @default(true)
  theme               String   @default("light")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String
  resource    String?
  details     Json?
  ipAddress   String?
  userAgent   String?
  status      String   @default("success")
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

model RateLimit {
  id          String   @id @default(cuid())
  key         String   @unique
  count       Int      @default(1)
  expiresAt   DateTime

  @@index([expiresAt])
}

model IdempotencyKey {
  id          String   @id @default(cuid())
  key         String   @unique
  userId      String
  response    Json
  createdAt   DateTime @default(now())
  expiresAt   DateTime

  @@index([expiresAt])
}
```

---

## 5. Business Logic

### 5.1 Donation Flow

```typescript
// lib/services/donation.service.ts

import { PrismaClient } from '@prisma/client';
import { bkashClient } from '@/lib/payment/bkash';
import { redis } from '@/lib/redis';

const prisma = new PrismaClient();

export class DonationService {
  async createDonation(userId: string, data: CreateDonationDto) {
    // 1. Check idempotency
    const existing = await this.checkIdempotency(data.idempotencyKey);
    if (existing) return existing;

    // 2. Validate user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isBanned) throw new Error('User not allowed');

    // 3. Create pending donation
    const donation = await prisma.donation.create({
      data: {
        userId,
        amount: data.amount,
        purpose: data.purpose,
        isAnonymous: data.isAnonymous,
        status: 'PENDING',
      },
    });

    // 4. Call bKash API
    try {
      const payment = await bkashClient.createPayment({
        amount: data.amount,
        callbackUrl: `${process.env.NEXT_PUBLIC_URL}/api/donations/callback`,
        donationId: donation.id,
      });

      // 5. Update donation with bKash payment ID
      await prisma.donation.update({
        where: { id: donation.id },
        data: { bkashPaymentId: payment.paymentID },
      });

      // 6. Store idempotency
      await this.storeIdempotency(data.idempotencyKey, {
        donationId: donation.id,
        paymentUrl: payment.bkashURL,
      });

      // 7. Log audit
      await this.logAudit(userId, 'DONATION_CREATED', {
        donationId: donation.id,
        amount: data.amount,
      });

      return {
        donationId: donation.id,
        paymentUrl: payment.bkashURL,
      };
    } catch (error) {
      // Update donation as failed
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: 'FAILED',
          failureReason: error.message,
        },
      });
      throw error;
    }
  }

  async verifyPayment(paymentId: string) {
    // 1. Call bKash Query API (independent verification)
    const verification = await bkashClient.queryPayment(paymentId);

    // 2. Find donation
    const donation = await prisma.donation.findUnique({
      where: { bkashPaymentId: paymentId },
    });

    if (!donation) throw new Error('Donation not found');

    // 3. Update status based on verification
    if (verification.statusCode === '0000' && verification.transactionStatus === 'Completed') {
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: 'SUCCESS',
          bkashTransactionId: verification.trxID,
          completedAt: new Date(),
        },
      });

      // Update organization raised amount
      await prisma.organization.update({
        where: { id: 1 },
        data: { raisedAmount: { increment: donation.amount } },
      });

      // Send confirmation email
      await this.sendDonationConfirmation(donation);

      return { success: true };
    } else {
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: 'FAILED',
          failureReason: verification.statusMessage,
        },
      });
      return { success: false };
    }
  }
}
```

---

### 5.2 Rate Limiting

```typescript
// lib/rate-limit.ts

import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const fullKey = `ratelimit:${key}`;
  const current = await redis.incr(fullKey);

  if (current === 1) {
    await redis.expire(fullKey, windowSeconds);
  }

  const ttl = await redis.ttl(fullKey);
  const resetAt = new Date(Date.now() + ttl * 1000);

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetAt,
  };
}

// Usage in API route
export async function POST(request: Request) {
  const session = await getServerSession();
  const limit = await rateLimit(
    `donation:${session.user.id}`,
    3, // 3 requests
    300 // per 5 minutes
  );

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': limit.resetAt.toISOString(),
        },
      }
    );
  }

  // Process request...
}
```

---

### 5.3 bKash Integration

```typescript
// lib/payment/bkash.ts

interface BKashPaymentRequest {
  amount: number;
  callbackUrl: string;
  donationId: string;
}

interface BKashCreateResponse {
  paymentID: string;
  bkashURL: string;
  statusCode: string;
  statusMessage: string;
}

class BKashClient {
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseUrl = process.env.BKASH_BASE_URL!;
  }

  private async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    const response = await fetch(`${this.baseUrl}/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        username: process.env.BKASH_USERNAME!,
        password: process.env.BKASH_PASSWORD!,
      },
      body: JSON.stringify({
        app_key: process.env.BKASH_APP_KEY!,
        app_secret: process.env.BKASH_APP_SECRET!,
      }),
    });

    const data = await response.json();
    this.token = data.id_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
    return this.token!;
  }

  async createPayment(req: BKashPaymentRequest): Promise<BKashCreateResponse> {
    const token = await this.getToken();

    const response = await fetch(`${this.baseUrl}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY!,
      },
      body: JSON.stringify({
        amount: req.amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: req.donationId,
        callbackURL: req.callbackUrl,
      }),
    });

    return response.json();
  }

  async queryPayment(paymentId: string) {
    const token = await this.getToken();

    const response = await fetch(`${this.baseUrl}/payment/query/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY!,
      },
    });

    return response.json();
  }

  async executePayment(paymentId: string) {
    const token = await this.getToken();

    const response = await fetch(`${this.baseUrl}/payment/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY!,
      },
      body: JSON.stringify({ paymentID: paymentId }),
    });

    return response.json();
  }
}

export const bkashClient = new BKashClient();
```

---

## 6. Security Implementation

### 6.1 Authentication Middleware

```typescript
// middleware.ts

import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    // Authenticated routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/donations')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/donations/:path*', '/api/admin/:path*'],
};
```

---

### 6.2 Input Validation Example

```typescript
// app/api/donations/create/route.ts

import { z } from 'zod';
import { NextResponse } from 'next/server';

const createDonationSchema = z.object({
  amount: z.number().min(10).max(100000),
  purpose: z.enum(['GENERAL_FUND', 'EDUCATION', 'MEDICAL', 'EMERGENCY']),
  isAnonymous: z.boolean(),
  idempotencyKey: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate
    const validated = createDonationSchema.parse(body);

    // Process
    const result = await donationService.createDonation(userId, validated);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
      },
      { status: 500 }
    );
  }
}
```

---

## 7. Error Handling

### 7.1 Error Types

```typescript
// lib/errors.ts

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super('NOT_FOUND', message, 404);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super('PAYMENT_ERROR', message, 402, details);
  }
}
```

---

## 8. Logging Strategy

```typescript
// lib/logger.ts

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
  redact: {
    paths: ['password', 'token', 'cookie', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
});

// Usage
logger.info({ userId, amount }, 'Donation created');
logger.error({ error, paymentId }, 'Payment verification failed');
```

---

## 9. Caching Strategy

| Data               | Cache Duration | Storage |
| ------------------ | -------------- | ------- |
| User profile       | 5 minutes      | Redis   |
| Donation history   | 1 minute       | Redis   |
| Organization stats | 5 minutes      | Redis   |
| bKash token        | 50 minutes     | Memory  |
| API responses      | Varies         | Redis   |

---

## 10. Testing Strategy

### 10.1 Unit Tests (Vitest)

```typescript
// __tests__/donation.service.test.ts

import { describe, it, expect, vi } from 'vitest';
import { DonationService } from '@/lib/services/donation.service';

describe('DonationService', () => {
  it('creates donation successfully', async () => {
    const service = new DonationService();
    const result = await service.createDonation('user_123', {
      amount: 500,
      purpose: 'GENERAL_FUND',
      isAnonymous: false,
      idempotencyKey: 'uuid',
    });

    expect(result).toHaveProperty('paymentUrl');
  });
});
```

### 10.2 Integration Tests

```typescript
// __tests__/api/donations.test.ts

import { POST } from '@/app/api/donations/create/route';

describe('POST /api/donations/create', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const request = new Request('http://localhost/api/donations/create', {
      method: 'POST',
      body: JSON.stringify({ amount: 500 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

---

**Document Owner:** Md. Rifat Hossain
**Review Cycle:** Monthly or when API changes
