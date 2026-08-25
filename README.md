# Donation Platform (School Organization)

A production-grade donation web platform for a school-run organization. Members log in with Google, manage a personal dashboard, donate via bKash, update their profile info, and use the site in Bangla (default) or English.

**Target scale:** ~1,000 users/month
**Stack:** Next.js 15 · PostgreSQL · Redis · NextAuth.js · bKash PGW · next-intl
**Status:** �️ Planning & infrastructure phase — source code not yet written
**Maintainer:** [riftbond007](https://github.com/riftbond007) (`abdullah.al.rifat2239@gmail.com`)

---

## 📚 Documentation Index

| Document                                                 | Description                                     |
| -------------------------------------------------------- | ----------------------------------------------- |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)           | System architecture, components, data flow      |
| [docs/FRONTEND_PLANNING.md](./docs/FRONTEND_PLANNING.md) | UI specs, components, i18n, responsive design   |
| [docs/BACKEND_PLANNING.md](./docs/BACKEND_PLANNING.md)   | API endpoints, Prisma schema, bKash integration |
| [docs/CI_CD_PIPELINE.md](./docs/CI_CD_PIPELINE.md)       | GitHub Actions, Docker, deployment              |
| [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) | Code organization and setup                     |
| [docs/WORKFLOW.md](./docs/WORKFLOW.md)                   | Unified workflow (research → deploy)            |
| [CONTRIBUTING.md](./CONTRIBUTING.md)                     | Branching, commits, PR conventions              |
| [SECURITY.md](./SECURITY.md)                             | How to report vulnerabilities                   |
| [.claude/agents/](./.claude/agents/)                     | 14 specialized development agents               |

---

## 🏗️ Architecture (Quick View)

```
                ┌─────────────────────────┐
                │   Next.js 15 (App Router)│
                │  Frontend + API Routes   │
                └────────────┬─────────────┘
                             │
              ┌──────────────┼───────────────┐
              ▼              ▼               ▼
        PostgreSQL        Redis         bKash PGW API
        (primary DB)   (session/cache/    (BD payments)
                         rate-limit)
```

**Deployment:** Single VPS (DigitalOcean/AWS Lightsail) with Docker + Nginx + Let's Encrypt.
No Kubernetes needed at this scale — keep it simple and maintainable.

---

## 👥 Roles & Permissions

| Role      | Permissions                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **user**  | Login, donate via bKash (no approval needed), update own profile, view own donation history                                                            |
| **admin** | Everything a user can + view/manage user list (ban/unban, search), view overall donation reports (read-only). **No control over donation flow itself** |

**Donation flow is fully self-service and automated** — admins only handle user management and reporting oversight.

---

## 🛠️ Tech Stack

| Layer              | Choice                                | Reason                                        |
| ------------------ | ------------------------------------- | --------------------------------------------- |
| Frontend + Backend | Next.js 15 (App Router)               | Unified full-stack framework, SSR-friendly    |
| Language           | TypeScript                            | Type safety across the stack                  |
| Package manager    | **pnpm 9**                            | Fast, disk-efficient, strict                  |
| Auth               | NextAuth.js v5 + Google Provider      | No passwords, built-in session handling       |
| Database           | PostgreSQL 16                         | Strong consistency, needed for financial data |
| ORM                | Prisma 5                              | Type-safe queries + migrations                |
| Cache / Session    | Redis 7                               | Sessions, rate limiting, idempotency          |
| Payment            | bKash Tokenized Checkout (PGW)        | Local BD payment method                       |
| i18n               | next-intl                             | SSR-friendly Bangla/English toggle            |
| File storage       | Cloudflare R2                         | Avatars, receipts                             |
| Deployment         | Docker + Nginx + Let's Encrypt on VPS | Full control, reusable DevOps skillset        |
| Error tracking     | Sentry                                | Production error visibility                   |
| UI Components      | shadcn/ui + Tailwind CSS              | Accessible, customizable                      |
| Forms              | React Hook Form + Zod                 | Type-safe form validation                     |
| State              | Zustand + TanStack Query              | Client + server state                         |
| Testing            | Vitest + Playwright                   | Unit + E2E testing                            |
| CI/CD              | GitHub Actions                        | Automated pipeline                            |

---

## 🗃️ Database Schema (Core Tables)

```sql
users        id, email (unique), name, avatar_url, phone,
             role (user|admin), language_pref (bn|en),
             is_banned, banned_at, banned_reason,
             profile_completed, created_at, updated_at, last_login_at

donations    id, user_id (FK), amount, currency, status, purpose,
             is_anonymous, bkash_payment_id, bkash_transaction_id,
             payment_method, failure_reason, metadata (JSON),
             created_at, updated_at, completed_at

sessions     id, user_id (FK), session_token (unique), expires, ip, ua

audit_logs   id, user_id (FK), action, resource, details (JSON),
             ip, ua, status, created_at

organizations (future)  id, name, descriptions_bn/en, goal, raised, is_active

user_settings user_id (FK), email_notifications, donation_receipts, theme
```

---

## 🔄 Core Flows

### Auth Flow

1. User clicks "Login with Google"
2. NextAuth OAuth → creates session
3. First-time login → "Complete Profile" (phone for bKash)
4. Redirect to dashboard

### Donation Flow

1. User selects amount → clicks Donate
2. Backend calls bKash Checkout → payment URL
3. User redirected to bKash, completes payment
4. bKash hits callback/webhook
5. **Backend independently verifies via bKash Query API** (NEVER trust callback data)
6. Donation updated → confirmation shown

### i18n Flow

- Routes: `/bn/dashboard`, `/en/dashboard`
- Static content in `bn.json` / `en.json`
- Stored in cookie + URL, toggle in UI

---

## ✅ Production-Grade Checklist

- [ ] Rate limiting (Redis sliding window)
- [ ] Input validation (Zod) on every form/API
- [ ] Idempotency keys for payment requests (prevent double-charge)
- [ ] HTTPS + CSRF (NextAuth built-in)
- [ ] Daily DB backups to S3
- [ ] Sentry error tracking
- [ ] Audit logs for sensitive actions
- [ ] bKash sandbox tested before production creds
- [ ] Multi-stage Docker build
- [ ] Health endpoint for monitoring
- [ ] Structured logging (Pino)
- [ ] Security headers (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Automated CI/CD (GitHub Actions)
- [ ] Container scanning (Trivy)
- [ ] Zero-downtime deploys

---

## 📋 Build Order

1. Project scaffold (Next.js + TS + Prisma + Postgres)
2. NextAuth Google login + session
3. User profile + settings (CRUD)
4. i18n (Bangla default, English toggle)
5. Dashboard UI (history, stats)
6. bKash sandbox integration → donation flow E2E
7. Admin role + user management
8. Production hardening (rate limit, validation, logging, backups)
9. Deploy (Docker + Nginx + Let's Encrypt on VPS)
10. Monitoring (Sentry + custom scripts)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9 --activate`)
- Docker + Docker Compose (for Postgres + Redis)
- PostgreSQL 16 client (optional, for debugging)

### Local Setup

```bash
# 1. Clone
git clone https://github.com/riftbond007/donation-platform.git
cd donation-platform

# 2. Install deps
pnpm install

# 3. Environment
cp .env.example .env.local
# edit .env.local with your credentials

# 4. Start DB + Redis
docker compose -f docker-compose.dev.yml up -d postgres redis

# 5. Database setup (after schema is written)
pnpm prisma migrate dev
pnpm prisma generate

# 6. Start dev server
pnpm dev

# 7. Visit
open http://localhost:3000
```

### Stack Status

| Component                                    | Status                     |
| -------------------------------------------- | -------------------------- |
| Documentation                                | ✅ Complete                |
| Infrastructure (Docker, Nginx, Scripts)      | ✅ Complete                |
| CI/CD (GitHub Actions)                       | ✅ Complete                |
| Source code (`src/`, `prisma/`, `messages/`) | ⏳ **Not yet implemented** |
| Tests                                        | � **Not yet implemented**  |

---

## 🚢 Deployment

Production deploys use the GitHub Actions pipeline in `.github/workflows/`:

1. Push to `main` → CI runs (lint, test, E2E, build)
2. On success → Docker image built and pushed to Docker Hub as `riftbond007/donation-platform`
3. Deploy workflow SSHs to VPS, pulls image, runs migrations, restarts services

**Required GitHub Secrets:**

- `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
- `SLACK_WEBHOOK` (for deployment notifications)

**First-time VPS setup:**

```bash
sudo ./scripts/setup-vps.sh yourdomain.com admin@yourdomain.com
```

See [docs/CI_CD_PIPELINE.md](./docs/CI_CD_PIPELINE.md) for full deployment guide.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Branch naming convention
- Conventional Commits format
- PR template and review process
- Testing requirements

---

## 📞 Support

- 🐛 **Bug reports** → [GitHub Issues](https://github.com/riftbond007/donation-platform/issues)
- 🔒 **Security issues** → see [SECURITY.md](./SECURITY.md)
- 💬 **Questions** → [GitHub Discussions](https://github.com/riftbond007/donation-platform/discussions)

---

## 📄 License

[MIT](./LICENSE)

---

_Last updated: August 20, 2026_
