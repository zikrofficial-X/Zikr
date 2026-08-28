# ZIKR Documentation Index

## Start here

- [`README.md`](./README.md) — installation, development, deployment, and database migration rules.
- [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — current project status and verified checks.
- [`QUICK_START_GITHUB_ACTIONS.md`](./QUICK_START_GITHUB_ACTIONS.md) — scheduled background jobs.

## Operations

- [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) — production deployment checklist.
- [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) — common runtime and deployment issues.
- [`GITHUB_ACTIONS_MIGRATION_GUIDE.md`](./GITHUB_ACTIONS_MIGRATION_GUIDE.md) — GitHub Actions configuration.
- [`OFFLINE_SUPPORT.md`](./OFFLINE_SUPPORT.md) — offline/PWA behavior.

## Authentication and data

- [`AUTH_SYSTEM_GUIDE.md`](./AUTH_SYSTEM_GUIDE.md) — Supabase authentication architecture.
- [`ENABLE_GOOGLE_OAUTH.md`](./ENABLE_GOOGLE_OAUTH.md) — optional Google OAuth setup.
- [`DATABASE_SCHEMA_INDEX.md`](./DATABASE_SCHEMA_INDEX.md) — schema reference.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — application architecture.
- [`docs/environment-variables.md`](./docs/environment-variables.md) — environment variable reference.

## Canonical source rules

- Deployable SQL migrations live only in [`supabase/migrations/`](./supabase/migrations/).
- [`supabase/migrations_archive/`](./supabase/migrations_archive/) is historical and must not be applied.
- `drizzle/schema.ts` is the type-safe schema reference. Its migration journal is retained for ORM history, but it is not a second deployment path.
- Use `pnpm verify` before opening a pull request.

This index intentionally omits historical audit reports and superseded setup notes so links do not point to conflicting instructions.
