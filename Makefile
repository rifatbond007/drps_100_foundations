# Convenience wrapper so `make dev`, `make test`, etc. work without
# remembering pnpm script names. Each target is a thin pass-through to
# the equivalent pnpm script in package.json — keep them in sync if you
# rename one.
#
# Run `make help` for the available targets.

.PHONY: help dev build start lint lint-fix format format-check type-check test test-watch test-ui test-cov test-e2e prisma-generate prisma-migrate prisma-studio prisma-seed docker-dev docker-dev-down docker-prod analyze ci-local

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

dev: ## Start Next.js dev server (hot reload)
	pnpm dev

build: ## Production build
	pnpm build

start: ## Start production server (requires `build` first)
	pnpm start

lint: ## ESLint check
	pnpm lint

lint-fix: ## ESLint check with --fix
	pnpm lint:fix

format: ## Prettier write
	pnpm format

format-check: ## Prettier check (CI mode)
	pnpm format:check

type-check: ## TypeScript check (tsc --noEmit)
	pnpm type-check

test: ## Run unit tests once
	pnpm test

test-watch: ## Run unit tests in watch mode
	pnpm test:watch

test-ui: ## Open Vitest UI
	pnpm test:ui

test-cov: ## Run unit tests with coverage
	pnpm test:cov

test-e2e: ## Run Playwright E2E tests
	pnpm test:e2e

prisma-generate: ## Generate Prisma client
	pnpm prisma:generate

prisma-migrate: ## Run prisma migrate dev
	pnpm prisma:migrate

prisma-studio: ## Open Prisma Studio
	pnpm prisma:studio

prisma-seed: ## Seed the database
	pnpm prisma:seed

docker-dev: ## Start Docker Compose dev stack
	pnpm docker:dev

docker-dev-down: ## Stop Docker Compose dev stack
	pnpm docker:dev:down

docker-prod: ## Start Docker Compose prod stack (detached)
	pnpm docker:prod

analyze: ## Build with bundle analyzer enabled
	pnpm analyze

ci-local: ## Run the exact CI step sequence locally (wipes .prisma first)
	@echo "==> wiping stale prisma client (simulates fresh CI checkout)"
	@rm -rf node_modules/.prisma
	@echo "==> prisma generate"
	@pnpm prisma generate
	@echo "==> format check"
	@pnpm format:check
	@echo "==> lint"
	@pnpm lint
	@echo "==> type-check"
	@pnpm type-check
	@echo "==> unit tests"
	@pnpm test
	@echo ""
	@echo "✅ all CI steps passed — safe to push"