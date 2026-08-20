## Summary

<!-- 1-3 sentence summary of what this PR does and why -->

## Type of Change

<!-- Mark with "x" — also matches Conventional Commits type in PR title -->
- [ ] `feat` — New feature (MINOR semver)
- [ ] `fix` — Bug fix (PATCH semver)
- [ ] `docs` — Documentation only
- [ ] `style` — Formatting, no code change
- [ ] `refactor` — Code change, neither fixes bug nor adds feature
- [ ] `perf` — Performance improvement
- [ ] `test` — Adding or updating tests
- [ ] `chore` — Build process or auxiliary tools
- [ ] `ci` — CI configuration
- [ ] `build` — Build system or dependencies
- [ ] `revert` — Reverts previous commit

## Conventional Commits

<!-- PR title MUST follow: type(scope): subject -->
<!-- Example: feat(payment): add bKash Query API verification -->

**Title format:** `<type>(<scope>): <subject>`

**Scope** (if applicable): `auth | payment | donation | i18n | db | ui | api | admin | infra`

## Related Issues

<!-- Link issues: Closes #123, Fixes #456, Refs #789 -->
- Closes #
- Refs #

## Changes Made

<!-- Bullet list of specific changes -->
-
-
-

## Why

<!-- Motivation — explain the "why", not the "what" -->

## Breaking Changes

<!-- Mark if any breaking changes -->
- [ ] No breaking changes
- [ ] Yes — described below

<!-- Describe migration path -->

## Test Plan

<!-- How was this tested? -->
- [ ] Unit tests added/updated (`pnpm test`)
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (`pnpm test:e2e`)
- [ ] Manual testing completed

**Test scenarios covered:**
-
-
-

## Screenshots / Recordings

<!-- Add before/after for UI changes -->
<!-- Drag images here or paste image URLs -->

## Checklist

- [ ] Git identity is `riftbond007 <abdullah.al.rifat2239@gmail.com>`
- [ ] Branch name follows convention (`type/scope-description`)
- [ ] PR title follows Conventional Commits
- [ ] Code follows project style guide (`pnpm lint`)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Unit tests pass
- [ ] E2E tests pass (if user-facing)
- [ ] Documentation updated (`README.md`, `docs/`, JSDoc)
- [ ] No secrets committed (no `.env`, credentials, tokens)
- [ ] No generated artifacts (`node_modules`, `.next`, `dist`)
- [ ] Self-reviewed the diff
- [ ] Commented code in hard-to-understand areas
- [ ] Related issues linked
- [ ] Reviewers assigned

## Deployment Notes

<!-- Any special deployment considerations, env var changes, DB migrations -->

## Additional Context

<!-- Any other information reviewers should know -->
