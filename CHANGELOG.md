# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive planning documentation (`docs/`)
- 14 specialized development agents (`.claude/agents/`)
- Production-grade Docker stack (`docker-compose.yml`, `Dockerfile`)
- Multi-stage Dockerfile with non-root user
- Nginx reverse proxy with rate limiting + security headers
- GitHub Actions CI/CD (lint, test, E2E, build, deploy)
- Database backup script with S3 upload + retention
- VPS setup script with fail2ban, ufw, certbot
- Health monitoring script with Slack alerts
- Conventional Commits enforcement (`.commitlintrc.json`)
- PR template and CODEOWNERS
- SECURITY.md vulnerability disclosure policy
- CONTRIBUTING.md with branching + commit conventions

### Fixed (Audit Phase)

- `backup-db.sh` actually contained restore logic — rewritten correctly
- `monitor.sh` had hardcoded path, no error tracking — fixed
- `setup-vps.sh` wrote `.env` to wrong directory — fixed
- `docker-compose.yml` had hardcoded `example.com` — now templated
- Dockerfile used `npm` while docs say `pnpm` — aligned to pnpm
- Health endpoint Docker check had no error handler — fixed
- Image name mismatch (`yourusername/` vs `riftbond007/`) — unified
- E2E CI job missing DB services — added
- `.dockerignore` was missing (would bloat image ~500MB) — added
- Nginx hardcoded `example.com` — now `${DOMAIN}` template

### Security

- Non-root Docker user (`nextjs`, uid 1001)
- Independent payment verification via bKash Query API (planned)
- Rate limiting at both Nginx and Redis layers
- Rate-limit zones match between nginx.conf and app.conf
- Audit logging for sensitive actions (planned)
- OWASP-aligned input validation via Zod (planned)

## [0.0.0] - 2026-08-20

### Added

- Initial project planning phase
- Documentation structure
- Agent ecosystem design
