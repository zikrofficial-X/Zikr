# ZIKR Documentation Index

## Start here

- [`README.md`](./README.md) — installation, development, deployment, and database migration rules.
- [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — current project status and verified checks.

## Operations

- [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) — production deployment checklist.
- [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) — common runtime and deployment issues.
- [`docs/OFFLINE_SUPPORT.md`](./docs/OFFLINE_SUPPORT.md) — offline/PWA behavior.
- [`docs/production-scheduling.md`](./docs/production-scheduling.md) — scheduler ownership and recovery jobs.
- [`docs/background-jobs.md`](./docs/background-jobs.md) — shared worker and production automation runbook.
- [`docs/VIDEO_PUBLISHING_GUIDE.md`](./docs/VIDEO_PUBLISHING_GUIDE.md) — canonical video generation and social publishing runbook.

## Authentication and data

- [`docs/AUTH_SYSTEM_GUIDE.md`](./docs/AUTH_SYSTEM_GUIDE.md) — Supabase authentication architecture.
- [`docs/ENABLE_GOOGLE_OAUTH.md`](./docs/ENABLE_GOOGLE_OAUTH.md) — optional Google OAuth setup.
- [`docs/DATABASE_SCHEMA_INDEX.md`](./docs/DATABASE_SCHEMA_INDEX.md) — schema reference.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — application architecture.
- [`docs/environment-variables.md`](./docs/environment-variables.md) — environment variable reference.

## Canonical source rules

- Deployable SQL migrations live only in [`supabase/migrations/`](./supabase/migrations/).
- [`supabase/migrations_archive/`](./supabase/migrations_archive/) is historical and must not be applied.
- Historical Drizzle migration records may remain inside `supabase/migrations/` because they are part of database history; there is no active Drizzle runtime or schema-migration path.
- Use `pnpm verify` and `pnpm build` before release.

This index contains only current operational documentation; obsolete root audit/deployment snapshots were removed after their findings were incorporated into the active architecture.
