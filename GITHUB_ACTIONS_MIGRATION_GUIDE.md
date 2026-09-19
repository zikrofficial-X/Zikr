# ZIKR automation and GitHub Actions operations

**Status:** GitHub Actions retired from the active repository  
**Last updated:** September 19, 2026

## Executive summary

ZIKR no longer uses GitHub Actions for CI, releases, scheduled jobs, or production background processing.

The active execution owners are:

1. **Vercel build gate** for deployment-time application verification.
2. **Supabase `pg_cron` / Edge Functions** for production scheduled workloads that belong in the database/runtime layer.
3. **External CI configuration** such as CircleCI for repository verification where required.

The `.github/workflows/` directory has been removed from `main`. This is intentional: the repository must not create new GitHub-hosted runner executions while the account-level billing/spending restriction remains unresolved.

## Current ownership

| Responsibility | Authoritative owner | Frequency | Production status |
| --- | --- | ---: | --- |
| Install, typecheck, lint, tests, route checks, migration replay, and build | Vercel build gate / external CI | Deployment / CI | Active |
| Prayer Web Push dispatch | Supabase `pg_cron` → worker | Every minute | Active |
| Video generation queue | Server-side / Supabase queue processing | Runtime-defined | Active path |
| Social publishing queue | Server-side publishing path | Runtime-defined | Active path |
| GitHub Actions workflows | None | None | Retired |

## Repository rule

Do **not** add files under `.github/workflows/`.

Do **not** add `push`, `pull_request`, `schedule`, `workflow_run`, or `workflow_dispatch` workflows for this project unless GitHub billing/runner eligibility has been deliberately reviewed and a new execution plan is explicitly approved.

Removing workflow files prevents new repository workflow executions, but it does not erase historical GitHub Actions usage, invoices, or an account-level billing lock. Those are controlled by GitHub account billing.

## Verification and operational commands

Use the repository scripts locally or through the configured external CI provider:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

For the Quran audio import, use the canonical importer directly from a trusted server/operator environment:

```bash
pnpm exec node scripts/import-quran-audio-to-supabase.mjs
```

Queue processing requires server-side secrets. Never run service-role operations in browser code.

## Secrets and security

Production secrets belong in Vercel, Supabase, or another explicitly approved protected server-side store. Never commit or expose `SUPABASE_SERVICE_ROLE_KEY`, provider access tokens, OAuth refresh tokens, or scheduler secrets to client code.

## Migration history note

Historical workflow files and GitHub Actions audit records may remain in Git history for traceability. They are historical records only and must not be restored into the active `main` tree without explicit approval.

## References

- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [ZIKR production scheduling runbook](docs/production-scheduling.md)
- [ZIKR background jobs runbook](docs/background-jobs.md)
