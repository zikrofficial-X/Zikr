# ZIKR Documentation Index

## Start here

- [`README.md`](./README.md) — installation, development, deployment, and database migration rules.
- [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — current project status and verified checks.

## Operations

- [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) — production deployment checklist.
- [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) — common runtime and deployment issues.
- [`docs/github-actions-replacement.md`](./docs/github-actions-replacement.md) — CircleCI migration and GitHub Actions retirement.
- [`OFFLINE_SUPPORT.md`](./OFFLINE_SUPPORT.md) — offline/PWA behavior.
- [`docs/production-scheduling.md`](./docs/production-scheduling.md) — scheduler ownership and recovery jobs.
- [`docs/background-jobs.md`](./docs/background-jobs.md) — CircleCI background processing runbook.

## Authentication and data

- [`AUTH_SYSTEM_GUIDE.md`](./AUTH_SYSTEM_GUIDE.md) — Supabase authentication architecture.
- [`ENABLE_GOOGLE_OAUTH.md`](./ENABLE_GOOGLE_OAUTH.md) — optional Google OAuth setup.
- [`DATABASE_SCHEMA_INDEX.md`](./DATABASE_SCHEMA_INDEX.md) — schema reference.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — application architecture.
- [`docs/environment-variables.md`](./docs/environment-variables.md) — environment variable reference.

## Canonical source rules

- Deployable SQL migrations live only in [`supabase/migrations/`](./supabase/migrations/).
- [`supabase/migrations_archive/`](./supabase/migrations_archive/) is historical and must not be applied.
- Historical Drizzle migration records may remain inside `supabase/migrations/` because they are part of database history; there is no active Drizzle runtime or schema-migration path.
- Use `pnpm verify` before opening a pull request.

This index contains only current operational documentation; superseded audit and release records remain in Git history.
