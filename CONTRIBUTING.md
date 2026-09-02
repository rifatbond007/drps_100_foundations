# Contributing to Donation Platform

Thank you for contributing! This document outlines the development workflow, commit conventions, and PR process.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Code Review](#code-review)
- [Testing Requirements](#testing-requirements)

## 🛠️ Development Setup

1. Clone the repo: `git clone https://github.com/riftbond007/donation-platform.git`
2. Install dependencies: `pnpm install`
3. Setup environment: `cp .env.example .env` and edit values
4. Run migrations: `pnpm prisma migrate dev`
5. Start dev server: `pnpm dev`

See [docs/CI_CD_PIPELINE.md](docs/CI_CD_PIPELINE.md) for deployment setup.

## 🌿 Branching Strategy

We use a **simplified Git Flow**:

```
main (production)
  ↑
develop (integration)
  ↑
feat/* / fix/* / docs/* / ...  (feature branches)
```

### Branch Naming Convention

```
<type>/<scope>-<short-description>
```

| Type          | Prefix      | Example                          |
| ------------- | ----------- | -------------------------------- |
| Feature       | `feat/`     | `feat/payment-bkash-integration` |
| Bug fix       | `fix/`      | `fix/auth-google-redirect-loop`  |
| Documentation | `docs/`     | `docs/update-readme`             |
| Refactor      | `refactor/` | `refactor/donation-service-cqrs` |
| Tests         | `test/`     | `test/donation-e2e-flow`         |
| Chore         | `chore/`    | `chore/update-prisma-5-22`       |
| Performance   | `perf/`     | `perf/db-query-optimization`     |
| CI/CD         | `ci/`       | `ci/add-e2e-workflow`            |
| Hotfix        | `hotfix/`   | `hotfix/payment-leak`            |

**Scopes:** `auth`, `payment`, `donation`, `i18n`, `db`, `ui`, `api`, `admin`, `infra`

## 💬 Commit Convention

We use [Conventional Commits 1.0.0](https://www.conventionalcommits.org/). Every commit message MUST follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description                        | SemVer |
| ---------- | ---------------------------------- | ------ |
| `feat`     | New feature                        | MINOR  |
| `fix`      | Bug fix                            | PATCH  |
| `docs`     | Documentation only                 | —      |
| `style`    | Formatting (no code change)        | —      |
| `refactor` | Neither fixes bug nor adds feature | —      |
| `perf`     | Performance improvement            | —      |
| `test`     | Adding or updating tests           | —      |
| `chore`    | Build/auxiliary tools              | —      |
| `ci`       | CI configuration                   | —      |
| `build`    | Build system                       | —      |
| `revert`   | Reverts previous commit            | —      |

### Rules

1. **Subject line** — imperative mood ("add" not "added"), no period, max 72 chars, lowercase
2. **Body** — explain _what_ and _why_ (not _how_), wrap at 100 chars
3. **Footer** — `BREAKING CHANGE:` for breaking changes, `Refs:` for issues
4. **No co-authors** — all commits are attributed to riftbond007

### Examples

```bash
# Simple
git commit -m "feat(payment): add bKash Query API verification"

# Multi-line
git commit -m "$(cat <<'EOF'
feat(auth): add Google OAuth provider

Replaces password-based login with Google OAuth. Users now
authenticate via their Google account, eliminating password
storage and reducing security risks.

Refs: #42
EOF
)"

# Breaking change
git commit -m "$(cat <<'EOF'
feat(api)!: change donation response format

BREAKING CHANGE: donation response now returns { success, data }
instead of { donation, paymentUrl }. Clients must update their
parsers.
EOF
)"
```

## 🔀 Pull Request Process

1. **Create a feature branch** following the naming convention
2. **Make your changes** in small, logical commits
3. **Write tests** for new functionality
4. **Update documentation** (`README.md`, `docs/`, JSDoc)
5. **Run local checks:**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   pnpm test:e2e
   ```
6. **Push your branch:** `git push -u origin <branch-name>`
7. **Open a PR** using the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
8. **Wait for CI** to pass (lint + tests + build)
9. **Request review** — `@riftbond007` is auto-assigned via CODEOWNERS
10. **Address feedback** with new commits (don't force-push during review)
11. **Squash merge** once approved (or use the "Squash and merge" button)

### PR Title Format

The PR title **must** follow Conventional Commits:

```
feat(scope): subject
fix(scope): subject
docs: subject
chore(deps): subject
```

## 👀 Code Review

- All PRs require review from `@riftbond007`
- CI must pass (lint + tests + build)
- Address all review comments before merging
- Use suggestion commits (apply → commit) rather than force-push during review

## 🧪 Testing Requirements

Every PR must include:

- [ ] **Unit tests** for new utility functions and hooks
- [ ] **Integration tests** for new API endpoints
- [ ] **E2E tests** for new user flows
- [ ] **Updated existing tests** if behavior changes
- [ ] **Coverage** must not decrease below 80%

See [docs/CI_CD_PIPELINE.md](docs/CI_CD_PIPELINE.md) for CI configuration.

## 🗄️ Database schema changes

**Any PR that edits `prisma/schema.prisma` MUST include a generated migration.** CI runs `pnpm db:deploy` against an ephemeral Postgres and then `pnpm db:status` — if the committed migrations don't match the schema, CI fails before the PR can merge.

Workflow:

```bash
# 1. Edit prisma/schema.prisma
# 2. Generate a migration (creates prisma/migrations/<timestamp>_<name>/migration.sql)
pnpm prisma migrate dev --name <short_description>
# 3. Verify the SQL is sane
cat prisma/migrations/<timestamp>_<name>/migration.sql
# 4. Re-run format/lint/type/test locally
make ci-local
# 5. Commit BOTH prisma/schema.prisma AND prisma/migrations/<timestamp>_<name>/migration.sql
```

**Never** use `prisma db push` against a shared environment — it bypasses migration history and is what caused the original prod drift. Local dev DBs may use `db push`, but production only ever sees migrations via `prisma migrate deploy`.

If you need to reset your local DB after a botched migration, run `pnpm prisma migrate reset` (this drops & recreates the schema, runs all migrations, and re-seeds). **Do not** manually `DROP TABLE` — it leaves `_prisma_migrations` in a state that breaks future deploys.

See [docs/CI_CD_PIPELINE.md](docs/CI_CD_PIPELINE.md#database-migrations) for the deploy-time migration flow.

## 🔒 Security

- **NEVER commit secrets** — `.env` files are git-ignored
- **Report vulnerabilities** privately to `@riftbond007`
- See [SECURITY.md](SECURITY.md) for our security policy

## 📞 Questions?

Open a [GitHub Discussion](https://github.com/riftbond007/donation-platform/discussions) or reach out to `@riftbond007`.

---

**Happy contributing! 🎉**
