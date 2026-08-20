# System Architecture

**Project:** Donation Platform (School Organization)
**Status:** Production-Grade Design
**Last Updated:** August 20, 2026

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  �──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile Web  │  │   Admin UI   │          │
│  │  (Next.js)   │  │  (Responsive)│  │  (Next.js)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE / CDN LAYER                           │
│              ┌──────────────────────────┐                       │
│              │   Cloudflare CDN + WAF   │                       │
│              │   (DDoS, SSL, Caching)   │                       │
│              └────────────┬─────────────┘                       │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Next.js 15 (App Router)                       │  │
│  │  �────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │  Frontend  │  │ API Routes │  │ Middleware │         │  │
│  │  │  (React)   │  │ (Backend)  │  │ (Auth/i18n)│         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │              │              │              │          │
│         ▼              ▼              ▼              ▼          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ NextAuth v5│ │  Business  │ │   bKash    │ │  External  │  │
│  │  (Auth)    │ │   Logic    │ │   Client   │ │   APIs     │  │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │ Cloudflare R2│          │
│  │  (Primary)   │  │ (Cache/Sess) │  │   (Files)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Frontend Layer

**Technology:** Next.js 15 (App Router) + React 19 + TypeScript

**Structure:**
```
src/app/
├── [locale]/                    # i18n routing (bn/en)
│   ├── (public)/                # Public routes
│   │   ├── page.tsx             # Landing page
│   │   ├── about/page.tsx
│   │   └── login/page.tsx
│   ├── (authenticated)/         # Protected routes
│   │   ├── dashboard/page.tsx
│   │   ├── donate/page.tsx
│   │   ├── history/page.tsx
│   │   └── settings/page.tsx
│   └── admin/                   # Admin-only routes
│       ├── users/page.tsx
│       └── reports/page.tsx
├── api/                         # API routes
│   ├── auth/[...nextauth]/
│   ├── donations/
│   ├── webhooks/bkash/
│   └── admin/
└── middleware.ts                # Auth + i18n middleware
```

**Key Responsibilities:**
- Server-side rendering (SSR) for SEO and performance
- Client-side interactivity for forms and real-time updates
- Route protection via middleware
- Language detection and switching

---

### 2.2 Backend Layer (API Routes)

**Technology:** Next.js API Routes + TypeScript + Zod

**API Structure:**
```
/api/
├── auth/
│   └── [...nextauth]/route.ts   # NextAuth handlers
├── donations/
│   ├── create/route.ts          # POST: Initiate donation
│   ├── callback/route.ts        # GET: bKash callback
│   └── webhook/route.ts         # POST: bKash webhook
├── users/
│   ├── profile/route.ts         # GET/PUT: User profile
│   └── settings/route.ts        # GET/PUT: User settings
├── admin/
│   ├── users/route.ts           # GET: List users
│   ├── users/[id]/ban/route.ts  # POST: Ban user
│   └── reports/route.ts         # GET: Donation reports
└── health/route.ts              # Health check endpoint
```

**Key Responsibilities:**
- Business logic execution
- Database operations (via Prisma)
- Payment gateway integration
- Input validation (Zod)
- Rate limiting
- Audit logging

---

### 2.3 Authentication Layer

**Technology:** NextAuth.js v5 (Auth.js) + Google OAuth Provider

**Flow:**
```
User → Google OAuth → NextAuth Callback → Session Creation → Database
                                ↓
                        First-time: Complete Profile
                                ↓
                          Redirect to Dashboard
```

**Session Management:**
- JWT-based sessions (stored in HTTP-only cookies)
- Session data cached in Redis for performance
- Automatic token refresh
- CSRF protection via NextAuth built-in

---

### 2.4 Database Layer

**Technology:** PostgreSQL 16 + Prisma ORM

**Schema Design Principles:**
- ACID compliance for financial transactions
- Proper foreign key relationships
- Indexes on frequently queried fields
- Soft deletes for user data (GDPR compliance)
- Audit trail for sensitive operations

**Connection Pooling:**
- PgBouncer for connection pooling
- Max 20 connections per instance
- Timeout: 30 seconds

---

### 2.5 Cache & Session Layer

**Technology:** Redis 7

**Use Cases:**
- Session storage (NextAuth)
- Rate limiting counters
- Temporary payment tokens
- API response caching
- Real-time leaderboard (top donors)

**Configuration:**
- Max memory: 256MB
- Eviction policy: allkeys-lru
- Persistence: AOF (Append Only File)

---

### 2.6 Payment Gateway Integration

**Technology:** bKash Checkout (PGW) API

**Architecture:**
```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │─────▶│ Next.js  │─────▶│  bKash   │
│ (Donate) │      │   API    │      │   API    │
└──────────┘      └──────────┘      └──────────┘
                          │
                          ▼
                   ┌──────────┐
                   │ Database │
                   └──────────┘
```

**Security Measures:**
1. **Idempotency Keys:** Prevent duplicate charges
2. **Independent Verification:** Always call Query API after callback
3. **Webhook Signature Validation:** Verify bKash signatures
4. **Amount Validation:** Server-side amount verification
5. **Transaction Logging:** Full audit trail

**Flow:**
1. User initiates donation → Backend creates pending record
2. Backend calls bKash Create Payment → Returns payment URL
3. User completes payment on bKash
4. bKash redirects to callback URL
5. **Backend independently verifies via Query API**
6. Update donation status (success/failed)
7. Send confirmation to user

---

## 3. Infrastructure Architecture

### 3.1 Deployment Topology

**Option A: VPS (Recommended for Full Control)**
```
┌─────────────────────────────────────────────────┐
│         VPS (DigitalOcean/AWS EC2)              │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Docker Compose Stack             │  │
│  │                                          │  │
│  │  ┌────────────┐    ┌────────────┐        │  │
│  │  │   Nginx    │───▶│  Next.js   │        │  │
│  │  │  (Reverse  │    │  (App)     │        │  │
│  │  │   Proxy)   │    │            │        │  │
│  │  └────────────┘    └────────────┘        │  │
│  │         │                │               │  │
│  │         ▼                ▼               │  │
│  │  ┌────────────┐    ┌────────────┐        │  │
│  │  │ PostgreSQL │    │   Redis    │        │  │
│  │  └────────────┘    └────────────┘        │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │   Certbot (Let's Encrypt SSL)            │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Option B: Vercel + Managed Services**
```
┌─────────────────────────────────────────────────┐
│              Vercel (Next.js Hosting)           │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │Supabase │  │ Upstash │  │Cloudflare│
   │(Postgres│  │ (Redis) │  │   R2    │
   └─────────┘  └─────────┘  └─────────┘
```

---

### 3.2 CI/CD Pipeline

**GitHub Actions Workflow:**

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│   Push   │─────▶│   Lint   │─────▶│   Test   │─────▶│  Build   │
│   Code   │      │   + Type │      │  (Unit + │      │ Docker   │
│          │      │   Check  │      │   E2E)   │      │  Image   │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
                                                              │
                                                              ▼
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Deploy  │�─────│   Push   │◀─────│  Scan    │◀─────│  Push to │
│ to VPS   │      │ to Docker│      │ Security │      │   Docker │
│          │      │   Hub    │      │  (Trivy) │      │   Hub    │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
```

**Stages:**
1. **Lint & Type Check** — ESLint, Prettier, TypeScript
2. **Unit Tests** — Vitest/Jest with >80% coverage
3. **E2E Tests** — Playwright on staging environment
4. **Build** — Multi-stage Docker build
5. **Security Scan** — Trivy vulnerability scanner
6. **Push** — Push image to Docker Hub
7. **Deploy** — SSH to VPS, pull image, restart containers

---

## 4. Security Architecture

### 4.1 Security Layers

```
┌─────────────────────────────────────────────────┐
│ Layer 1: Network Security                       │
│  - Cloudflare WAF (DDoS protection)             │
│  - HTTPS only (TLS 1.3)                         │
│  - Rate limiting (Cloudflare + Redis)           │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│ Layer 2: Application Security                   │
│  - CSRF protection (NextAuth)                   │
│  - XSS prevention (React + CSP headers)         │
│  - SQL injection prevention (Prisma)            │
│  - Input validation (Zod)                       │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│ Layer 3: Authentication & Authorization        │
│  - OAuth 2.0 (Google)                           │
│  - JWT sessions (HTTP-only cookies)             │
│  - Role-based access control (RBAC)             │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│ Layer 4: Data Security                          │
│  - Encryption at rest (database)                │
│  - Encryption in transit (TLS)                  │
│  - PII data minimization                        │
│  - Audit logging                                │
└─────────────────────────────────────────────────┘
```

---

### 4.2 Rate Limiting Strategy

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 5 requests | 1 minute |
| `/api/donations/create` | 3 requests | 5 minutes |
| `/api/users/profile` | 10 requests | 1 minute |
| `/api/admin/*` | 30 requests | 1 minute |
| General API | 60 requests | 1 minute |

---

## 5. Monitoring & Observability

### 5.1 Monitoring Stack

```
┌─────────────────────────────────────────────────┐
│         Application Metrics (Prometheus)        │
│         Application Logs (Loki)                 │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              Grafana Dashboard                  │
│  - Request latency                              │
│  - Error rates                                  │
│  - Database performance                         │
│  - Payment success/failure rates                │
│  - Active users                                 │
└─────────────────────────────────────────────────┘
```

### 5.2 Error Tracking

**Sentry Integration:**
- Client-side errors
- Server-side errors
- Performance monitoring
- Release tracking

### 5.3 Logging Strategy

**Log Levels:**
- **ERROR:** System errors, payment failures
- **WARN:** Deprecated API usage, rate limit warnings
- **INFO:** User actions, system events
- **DEBUG:** Detailed debugging (dev only)

**Log Format (JSON):**
```json
{
  "timestamp": "2026-08-20T10:30:00Z",
  "level": "INFO",
  "message": "Donation created",
  "userId": "user_123",
  "amount": 500,
  "transactionId": "BKS123456",
  "ip": "192.168.1.1"
}
```

---

## 6. Disaster Recovery & Backup

### 6.1 Backup Strategy

**Database Backups:**
- **Frequency:** Daily automated backups at 2 AM (BD time)
- **Retention:** 30 days
- **Storage:** Off-site (S3/Backblaze)
- **Encryption:** AES-256

**Recovery Time Objective (RTO):** 1 hour
**Recovery Point Objective (RPO):** 24 hours

### 6.2 Backup Process

```
Cron Job (2 AM daily)
    ↓
pg_dump → Encrypt → Upload to S3
    ↓
Verify backup integrity
    ↓
Send notification (Slack/Email)
```

---

## 7. Scalability Considerations

### 7.1 Current Scale (~1,000 users/month)

**Capacity:**
- 50-100 concurrent users
- ~100 donations/day
- <10 GB database size

**Resources:**
- VPS: 2 CPU, 4 GB RAM, 50 GB SSD
- Database: 1 GB RAM, 10 GB storage
- Redis: 256 MB

### 7.2 Future Scaling Path

**When to Scale:**
- >10,000 users/month → Upgrade VPS (4 CPU, 8 GB RAM)
- >100,000 users/month → Migrate to Kubernetes
- >1M users/month → Multi-region deployment

**Scaling Strategies:**
1. **Vertical Scaling:** Upgrade VPS resources
2. **Horizontal Scaling:** Multiple Next.js instances + load balancer
3. **Database Scaling:** Read replicas, connection pooling
4. **CDN:** Cloudflare for static assets
5. **Microservices:** Split if monolith becomes bottleneck

---

## 8. Technology Decisions

### 8.1 Why Monolith?

**Pros:**
- Simpler deployment
- Easier development for small team
- Lower operational overhead
- Faster initial development

**Cons:**
- Harder to scale individual components
- Tight coupling

**Verdict:** Appropriate for ~1K users/month. Can migrate to microservices if needed.

### 8.2 Why PostgreSQL?

- **ACID compliance** — Critical for financial data
- **Strong consistency** — No eventual consistency issues
- **Mature ecosystem** — Well-documented, reliable
- **JSON support** — Flexible for evolving schema
- **Full-text search** — Built-in (no need for Elasticsearch)

### 8.3 Why Redis?

- **Performance** — In-memory, sub-millisecond latency
- **Versatility** — Sessions, cache, rate limiting, pub/sub
- **Persistence** — AOF for durability
- **Simple operations** — Easy to maintain

---

## 9. Development Workflow

### 9.1 Git Strategy

**Branching Model:** Git Flow (simplified)

```
main (production)
  ├── develop (staging)
  │   ├── feature/auth
  │   ├── feature/donations
  │   └── feature/admin
  └── hotfix/critical-bug
```

### 9.2 Code Quality

- **Linting:** ESLint + Prettier
- **Type Checking:** TypeScript strict mode
- **Testing:** Unit (Vitest) + E2E (Playwright)
- **Code Review:** Required for all PRs
- **Coverage:** Minimum 80%

### 9.3 Pre-commit Hooks

- Run linter
- Run type checker
- Run unit tests
- Check formatting

---

## 10. API Design Principles

### 10.1 RESTful Conventions

- Use nouns for resources: `/donations`, `/users`
- HTTP methods: GET (read), POST (create), PUT (update), DELETE (delete)
- Status codes: 200, 201, 400, 401, 403, 404, 500
- Consistent error responses:
  ```json
  {
    "error": {
      "code": "DONATION_FAILED",
      "message": "Payment processing failed",
      "details": {}
    }
  }
  ```

### 10.2 Versioning

- URL-based: `/api/v1/donations`
- Header-based: `Accept: application/vnd.api+json;version=1`

---

**Document Owner:** Md. Rifat Hossain
**Review Cycle:** Quarterly or when major changes occur
