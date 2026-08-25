# Unified Workflow Guide

**Project:** Donation Platform (School Organization)
**Purpose:** Connect research → design → development → deployment without losing context
**Last Updated:** August 20, 2026

---

## Overview

This document defines a **single source of truth** workflow that connects every phase of the donation platform's lifecycle. Each phase produces artifacts that the next phase consumes, so context flows continuously from idea to production.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ RESEARCH │───▶│  DESIGN  │───▶│   DEV    │───▶│   QA     │───▶│ DEPLOY   │
│          │    │          │    │          │    │          │    │          │
│ Discover │    │ Architect│    │ Implement│    │ Validate │    │ Release  │
│  Decide  │    │  Plan    │    │  Build   │    │  Verify  │    │ Operate  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
      │              │              │              │              │
      └──────────────┴──────────────┴──────────────┴──────────────┘
                              │
                     Context Repository
                    (docs/, code, configs)
```

---

## 1. Phase 1: Research & Discovery

### 1.1 Goals

- Understand requirements
- Resolve open questions
- Validate technical decisions
- Document constraints

### 1.2 Activities

| Activity                   | Output                 | Owner         |
| -------------------------- | ---------------------- | ------------- |
| Stakeholder interviews     | Requirements doc       | PM            |
| Technical research         | Decision records (ADR) | Tech lead     |
| Payment gateway evaluation | Integration plan       | Backend lead  |
| Security review            | Threat model           | Security      |
| Localization research      | i18n requirements      | Frontend lead |

### 1.3 Deliverables

**Files created/updated:**

- `docs/RESEARCH.md` — Research findings
- `docs/DECISIONS.md` — Architecture decision records (ADRs)
- `docs/REQUIREMENTS.md` — Functional & non-functional requirements

### 1.4 Exit Criteria

- [ ] All open questions from README resolved
- [ ] Tech stack confirmed
- [ ] Payment gateway credentials obtained (sandbox)
- [ ] Deployment target decided (VPS vs Vercel)

### 1.5 Context Handoff → Phase 2

The Research phase outputs **feed directly** into Design:

- Requirements → UI/UX specifications
- ADRs → Architecture decisions
- Constraints → Technical design limits

---

## 2. Phase 2: Design & Planning

### 2.1 Goals

- Translate requirements into technical design
- Define system architecture
- Plan implementation order
- Specify contracts between components

### 2.2 Activities

| Activity            | Output               | Owner     |
| ------------------- | -------------------- | --------- |
| Architecture design | ARCHITECTURE.md      | Tech lead |
| API contract design | BACKEND_PLANNING.md  | Backend   |
| UI/UX design        | FRONTEND_PLANNING.md | Frontend  |
| Database schema     | Prisma schema        | Backend   |
| CI/CD design        | CI_CD_PIPELINE.md    | DevOps    |

### 2.3 Deliverables

**Files created/updated:**

- `docs/ARCHITECTURE.md` — System architecture (already exists)
- `docs/FRONTEND_PLANNING.md` — UI specifications (already exists)
- `docs/BACKEND_PLANNING.md` — API specifications (already exists)
- `docs/CI_CD_PIPELINE.md` — Pipeline design (already exists)
- `docs/PROJECT_STRUCTURE.md` — File organization (already exists)
- `prisma/schema.prisma` — Database schema
- `docs/API.md` — API contract documentation

### 2.4 Exit Criteria

- [ ] Architecture reviewed and approved
- [ ] API contracts defined (request/response)
- [ ] Database schema finalized
- [ ] UI mockups reviewed
- [ ] Deployment topology confirmed

### 2.5 Context Handoff → Phase 3

Design outputs **become the implementation spec**:

- Architecture → File structure
- API spec → Route handlers
- UI spec → Components
- Schema → Models

---

## 3. Phase 3: Development

### 3.1 Goals

- Implement features per design
- Write tests alongside code
- Maintain documentation sync
- Follow coding standards

### 3.2 Implementation Order (Build Order)

Following the build order from README:

| #   | Feature                 | Documentation Reference   | Tests Required     |
| --- | ----------------------- | ------------------------- | ------------------ |
| 1   | Project scaffold        | PROJECT_STRUCTURE.md      | Setup verification |
| 2   | NextAuth Google login   | BACKEND_PLANNING.md §3.1  | Unit + E2E         |
| 3   | User profile + settings | BACKEND_PLANNING.md §3.3  | Unit + E2E         |
| 4   | i18n setup              | FRONTEND_PLANNING.md §6   | Unit               |
| 5   | Dashboard UI            | FRONTEND_PLANNING.md §3.2 | E2E                |
| 6   | bKash integration       | BACKEND_PLANNING.md §5.3  | Integration + E2E  |
| 7   | Admin role              | BACKEND_PLANNING.md §3.4  | Unit + E2E         |
| 8   | Production hardening    | BACKEND_PLANNING.md §6    | All                |

### 3.3 Development Loop

For each feature:

```
┌─────────────────────────────────────────────────────────────┐
│                    Feature Development Loop                  │
│                                                             │
│   1. Read spec from docs/                                   │
│           │                                                  │
│           ▼                                                  │
│   2. Create branch (feature/<name>)                          │
│           │                                                  │
│           ▼                                                  │
│   3. Implement code (following ARCHITECTURE.md)              │
│           │                                                  │
│           ▼                                                  │
│   4. Write tests (unit + integration)                       │
│           │                                                  │
│           ▼                                                  │
│   5. Run linters & type check locally                        │
│           │                                                  │
│           ▼                                                  │
│   6. Update docs/ if behavior changed                       │
│           │                                                  │
│           ▼                                                  │
│   7. Commit (conventional commits)                          │
│           │                                                  │
│           ▼                                                  │
│   8. Push & open PR                                         │
│           │                                                  │
│           ▼                                                  │
│   9. CI runs (lint → test → build → scan)                   │
│           │                                                  │
│           ▼                                                  │
│  10. Code review → merge                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Branch Strategy

**Git Flow (simplified):**

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/auth
  │     ├── feature/donations
  │     ├── feature/admin
  │     └── feature/i18n
  │
  ├── release/v1.0.0
  │
  └── hotfix/critical-bug
```

**Branch naming:**

- `feature/<short-name>` — New features
- `fix/<short-name>` — Bug fixes
- `chore/<short-name>` — Maintenance
- `docs/<short-name>` — Documentation only
- `refactor/<short-name>` — Code refactoring

### 3.5 Commit Convention

Use **Conventional Commits:**

```bash
feat: add bKash payment integration
fix: resolve session timeout issue
docs: update API specification
style: format code with prettier
refactor: extract donation service
test: add E2E tests for login flow
chore: update dependencies
```

### 3.6 Context Sync During Development

**Documentation must stay in sync with code:**

| When code changes...          | Update documentation...       |
| ----------------------------- | ----------------------------- |
| API endpoint added/changed    | `docs/BACKEND_PLANNING.md`    |
| New component added           | `docs/FRONTEND_PLANNING.md`   |
| Architecture decision changed | `docs/ARCHITECTURE.md`        |
| Database schema migrated      | `prisma/schema.prisma` + docs |
| CI/CD pipeline changed        | `docs/CI_CD_PIPELINE.md`      |
| New file/folder structure     | `docs/PROJECT_STRUCTURE.md`   |

### 3.7 Deliverables

**Code artifacts:**

- `src/` — Application source
- `prisma/` — Database schema and migrations
- `tests/` — Test files
- `.github/workflows/` — CI/CD definitions

**Updated docs:**

- All `docs/*.md` files kept current
- `README.md` reflects latest status

---

## 4. Phase 4: Quality Assurance

### 4.1 Goals

- Verify feature completeness
- Catch regressions early
- Validate security & performance
- Confirm user experience

### 4.2 Test Pyramid

```
                    ╱╲
                   ╱  ╲           E2E Tests (Playwright)
                  ╱ 5% ╲          Critical user journeys
                 ╱──────╲
                ╱        ╲        Integration Tests
               ╱   25%    ╲       API endpoints, services
              ╱────────────╲
             ╱              ╲     Unit Tests (Vitest)
            ╱      70%       ╲    Functions, components
           ╱──────────────────╲
```

### 4.3 Test Strategy by Layer

| Layer       | Tool                     | Coverage Target | What to Test                     |
| ----------- | ------------------------ | --------------- | -------------------------------- |
| Unit        | Vitest                   | 80%+            | Pure functions, hooks, utilities |
| Component   | Vitest + Testing Library | 70%+            | UI components, interactions      |
| Integration | Vitest + Supertest       | 90%+            | API routes, DB operations        |
| E2E         | Playwright               | Critical paths  | User journeys, flows             |

### 4.4 Required Test Cases

#### Auth Flow

- [ ] Google OAuth login success
- [ ] First-time user profile completion
- [ ] Returning user redirects to dashboard
- [ ] Logout clears session
- [ ] Protected route redirects to login

#### Donation Flow

- [ ] Amount validation (min/max)
- [ ] bKash redirect URL generated correctly
- [ ] Callback verification (independent query)
- [ ] Idempotency key prevents duplicate charges
- [ ] Failed payment updates status correctly
- [ ] Success triggers confirmation email

#### Admin Flow

- [ ] Admin can view all users
- [ ] Non-admin gets 403 on admin routes
- [ ] Ban/unban user works
- [ ] Reports generate correctly

### 4.5 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code coverage ≥80%
- [ ] Linter passing (0 errors)
- [ ] TypeScript strict mode passing
- [ ] Bundle size within limits (<200KB)
- [ ] Security scan: 0 critical vulnerabilities
- [ ] Documentation updated
- [ ] Changelog entry added

---

## 5. Phase 5: Deployment & Release

### 5.1 Goals

- Ship to production safely
- Zero downtime
- Roll back capability
- Post-deployment verification

### 5.2 Deployment Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────�
│  Push   │───▶│   CI    │───▶│  Build  │───▶│  Scan   │───▶│ Deploy  │
│ to main │    │ Pass?   │    │ Docker  │    │ Security│    │   VPS   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                                    │                            │
                                    ▼                            ▼
                              ┌─────────�                ┌─────────────┐
                              │  Push   │                │  Verify &   │
                              │ Docker  │                │   Monitor   │
                              │  Hub    │                │             │
                              └─────────┘                └─────────────┘
```

### 5.3 Deployment Workflow

**Step-by-step:**

1. **Merge to main** → Triggers CI pipeline
2. **CI Pipeline** → Lint, test, build, scan
3. **Build Docker image** → Multi-platform (amd64, arm64)
4. **Push to Docker Hub** → Tagged with version + SHA
5. **Deploy workflow triggers** → SSH to VPS
6. **Run migrations** → `prisma migrate deploy`
7. **Pull new image** → `docker compose pull`
8. **Restart services** → Zero-downtime rolling restart
9. **Health check** → Verify `/api/health` returns 200
10. **Slack notification** → Success/failure alert

### 5.4 Rollback Strategy

**If deployment fails:**

```bash
# SSH to VPS
ssh user@vps

# Check current version
docker compose ps

# Rollback to previous version
docker compose down
docker pull yourusername/donation-platform:previous-tag
# Update docker-compose.yml to use previous tag
docker compose up -d

# Verify
curl https://example.com/api/health

# Notify team
# Post in #deployments channel
```

### 5.5 Release Process

**Semantic versioning:**

```
MAJOR.MINOR.PATCH
   │     │     │
   │     │     └─ Bug fixes
   │     └─────── New features (backward compatible)
   └───────────── Breaking changes
```

**Release checklist:**

- [ ] All features tested
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created (`v1.0.0`)
- [ ] Docker image tagged
- [ ] Migration plan reviewed
- [ ] Backup taken before deployment
- [ ] Rollback plan documented

### 5.6 Post-Deployment Verification

```bash
# 1. Health check
curl https://example.com/api/health

# 2. Database connectivity
docker compose exec postgres pg_isready -U donation

# 3. Redis connectivity
docker compose exec redis redis-cli ping

# 4. Smoke test (manual)
# - Login with Google
# - Make small donation
# - Check donation history

# 5. Monitor logs
docker compose logs -f app --tail=100

# 6. Check metrics
# - Error rate
# - Response time
# - Active users
```

---

## 6. Context Flow Between Phases

### 6.1 Context Repository

All phases write to and read from a **single context repository** (the `docs/` folder + codebase):

```
┌─────────────────────────────────────────────────────────┐
│                 Context Repository                      │
│                                                         │
│   📁 docs/                                              │
│   ├── README.md              ◀── Entry point            │
│   ├── WORKFLOW.md            ◀── This document          │
│   ├── ARCHITECTURE.md        ◀── System design          │
│   ├── FRONTEND_PLANNING.md   ◀── UI specs               │
│   ├── BACKEND_PLANNING.md    ◀── API specs              │
│   ├── CI_CD_PIPELINE.md      ◀── Pipeline design        │
│   ├── PROJECT_STRUCTURE.md   ◀── File organization      │
│   └── DECISIONS.md           ◀── Architecture decisions │
│                                                         │
│   💻 src/                  ◀── Implementation          │
│   🗄️ prisma/                ◀── Database schema        │
│   🧪 tests/                 ◀── Test coverage          │
│   ⚙️ .github/workflows/      ◀── CI/CD definitions      │
│   🐳 docker-compose.yml     ◀── Deployment config      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Phase Hand-off Matrix

| From → To               | What flows forward                   | Format          |
| ----------------------- | ------------------------------------ | --------------- |
| Research → Design       | Requirements, constraints, decisions | Markdown docs   |
| Design → Development    | Specs, schemas, contracts            | Code + docs     |
| Development → QA        | Code, unit tests                     | Git branches    |
| QA → Deployment         | Test reports, sign-off               | CI artifacts    |
| Deployment → Operations | Deployed code, runbooks              | Tagged releases |

### 6.3 Traceability Matrix

Every requirement traces through to production:

```
Requirement
   ↓
Design Doc (BACKEND_PLANNING.md)
   ↓
Implementation (src/app/api/donations/create/route.ts)
   ↓
Test (tests/api/donations.test.ts)
   ↓
Deployment (docker-compose.yml)
   ↓
Monitoring (Grafana dashboard)
   ↓
User (production behavior)
```

### 6.4 Decision Log Template

When making architectural decisions, document them in `docs/DECISIONS.md`:

```markdown
## ADR-001: Use PostgreSQL for Primary Database

**Date:** 2026-08-20
**Status:** Accepted
**Context:** Need ACID compliance for financial transactions
**Decision:** Use PostgreSQL 16
**Consequences:**

- ✅ ACID compliance
- ✅ Strong consistency
- ❌ Higher operational overhead than NoSQL
  **Alternatives Considered:** MongoDB, MySQL
```

---

## 7. Continuous Operations

### 7.1 Monitoring (Post-Deployment)

**Daily checks:**

- Application health endpoint
- Database connections
- Redis memory usage
- Error rate trends

**Weekly reviews:**

- Backup verification
- Security log review
- Performance metrics
- User feedback

### 7.2 Incident Response

**Severity levels:**

| Severity      | Response Time | Examples                             |
| ------------- | ------------- | ------------------------------------ |
| P0 - Critical | <15 min       | App down, payment failures           |
| P1 - High     | <1 hour       | Degraded performance, broken feature |
| P2 - Medium   | <4 hours      | Minor bugs, UI issues                |
| P3 - Low      | Next sprint   | Cosmetic issues, nice-to-haves       |

**Incident runbook:**

```markdown
## P0: App Down

1. Check health endpoint: `curl https://example.com/api/health`
2. Check container status: `docker compose ps`
3. View logs: `docker compose logs --tail=200 app`
4. Restart if needed: `docker compose restart app`
5. Verify recovery: `curl https://example.com/api/health`
6. Post-mortem within 24 hours
```

### 7.3 Feedback Loop

User feedback feeds back to Research phase:

```
Production users
       │
       ▼
Bug reports, feature requests
       │
       ▼
GitHub Issues
       │
       ▼
Triage & Prioritize
       │
       ▼
Backlog (next sprint planning)
       │
       ▼
Research phase (new requirements)
       │
       └─────────► (loop continues)
```

---

## 8. Tooling & Automation

### 8.1 Tools by Phase

| Phase       | Primary Tools                     |
| ----------- | --------------------------------- |
| Research    | Markdown editor, decision records |
| Design      | Figma, draw.io, ERD tools         |
| Development | VS Code, Git, npm                 |
| QA          | Vitest, Playwright, ESLint        |
| Deployment  | GitHub Actions, Docker, SSH       |

### 8.2 Automation Points

**Automated by CI:**

- ✅ Linting on every push
- ✅ Type checking on every push
- ✅ Unit tests on every push
- ✅ E2E tests on every PR
- ✅ Docker build on every merge to main
- ✅ Security scan on every build
- ✅ Deployment on merge to main

**Manual steps:**

- ⚠️ Code review approval
- ⚠️ Production deployment approval (for main branch)
- ⚠️ Database migration approval
- ⚠️ Release tagging

---

## 9. Roles & Responsibilities

| Role                   | Primary Responsibility               |
| ---------------------- | ------------------------------------ |
| **Product Owner**      | Requirements, priorities, acceptance |
| **Tech Lead**          | Architecture, code review, decisions |
| **Backend Developer**  | API routes, database, business logic |
| **Frontend Developer** | UI components, pages, client logic   |
| **DevOps Engineer**    | CI/CD, deployment, monitoring        |
| **QA Engineer**        | Test planning, E2E testing, sign-off |
| **Security**           | Threat model, security review, audit |

---

## 10. Communication Cadence

| Event               | Frequency        | Participants            |
| ------------------- | ---------------- | ----------------------- |
| Standup             | Daily            | Dev team                |
| Sprint planning     | Bi-weekly        | Full team               |
| Code review         | Per PR           | Reviewer + author       |
| Architecture review | Per major change | Tech lead + senior devs |
| Retrospective       | Bi-weekly        | Full team               |
| Production review   | Weekly           | DevOps + tech lead      |

---

## 11. Quick Reference

### 11.1 Common Commands

```bash
# Local development
npm run dev

# Run tests
npm run test:unit
npm run test:e2e

# Lint & format
npm run lint
npm run format

# Database
npm run prisma:migrate
npm run prisma:studio

# Docker
npm run docker:dev
npm run docker:logs

# Production deploy
git tag v1.0.0
git push origin v1.0.0
# (GitHub Actions handles the rest)
```

### 11.2 Documentation Locations

- **Architecture:** `docs/ARCHITECTURE.md`
- **Frontend:** `docs/FRONTEND_PLANNING.md`
- **Backend:** `docs/BACKEND_PLANNING.md`
- **CI/CD:** `docs/CI_CD_PIPELINE.md`
- **Project structure:** `docs/PROJECT_STRUCTURE.md`
- **Workflow:** `docs/WORKFLOW.md` (this file)
- **Decisions:** `docs/DECISIONS.md`

### 11.3 Emergency Contacts

```
Production issues → #production-alerts Slack channel
Security incidents → security@example.com
Payment failures → #payments Slack channel
```

---

**Document Owner:** Md. Rifat Hossain
**Review Cycle:** Monthly or when workflow changes
