# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x.x   | ✅ |
| < 1.0   | ❌ |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in this project, please email:

📧 **riftbond007@users.noreply.github.com**

(or open a [GitHub Security Advisory](https://github.com/riftbond007/donation-platform/security/advisories/new) privately)

You should receive an acknowledgment within **48 hours**. We aim to:
- Triage and confirm the issue within **3 business days**
- Provide a fix timeline within **7 days** for critical issues
- Credit reporters (if desired) in the fix release notes

## What to Include

When reporting, please include:

1. **Description** — what the vulnerability is and its impact
2. **Reproduction** — minimal steps to reproduce
3. **Environment** — version, deployment (sandbox/production), relevant config
4. **Suggested fix** — if you have one (optional but appreciated)

## Security Measures in Place

This project implements:

- 🔒 HTTPS-only via Let's Encrypt
- 🛡️ NextAuth.js session security (HTTP-only cookies, JWT)
- ⚡ Rate limiting (Nginx + Redis sliding window)
- ✅ Input validation (Zod) on every endpoint
- 🔐 Independent bKash payment verification (Query API, never trust callback)
- � Audit logging for sensitive actions
- 🚫 Server-side authorization checks (RBAC)
- � Secrets management via environment variables only
- 🐳 Non-root Docker user (uid 1001)
- 📦 Multi-stage Docker build (smaller attack surface)
- 🔍 Trivy container scanning (in CI, when configured)

## Out of Scope

The following are not considered vulnerabilities in this project:

- Denial-of-service attacks requiring >1 Gbps of traffic
- Social engineering attacks against maintainers
- Issues in third-party dependencies (report upstream)
- Self-XSS (paste your own malicious code)

## Acknowledgments

We thank the security community for helping keep this project safe.
