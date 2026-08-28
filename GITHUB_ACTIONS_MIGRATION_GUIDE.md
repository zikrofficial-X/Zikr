# Zikr automation and GitHub Actions operations

**Status:** Current architecture documented

## Executive summary

Zikr no longer uses GitHub Actions as its production scheduler. Every Vercel deployment runs the repository verification gate through `pnpm verify`, while Supabase `pg_cron` owns the minute-level production automation. The prayer notification worker is a Supabase Edge Function, and the video/social queue entrypoint is the authenticated Vercel route `/api/internal/video-processing`.

GitHub Actions remains in the repository for operator-invoked verification and recovery. Both workflows are intentionally `workflow_dispatch`-only because GitHub currently reports an account-level billing lock that prevents hosted runners from starting. This is an external account constraint; changing YAML cannot bypass it.

## Current ownership

| Responsibility | Authoritative owner | Frequency | Production status |
|---|---|---:|---|
| Install, typecheck, lint, tests, route checks, and build | Vercel build gate (`pnpm verify`) | Every deployment | Active |
| Prayer Web Push dispatch | Supabase `pg_cron` → `prayer-notification-worker` | Every minute | Active |
| Video and social queue processing | Supabase `pg_cron` → `/api/internal/video-processing` | Every minute | Active, authenticated by the scheduler secret |
| Manual queue recovery | GitHub `Background Jobs` workflow | On demand | Available only when GitHub runners can start |
| Manual verification fallback | GitHub `Continuous Integration` workflow | On demand | Available only when GitHub runners can start |

There must be only one automatic owner for each queue. Do not add a GitHub schedule or a Vercel Cron entry for a queue that is already owned by Supabase.

## Workflows in the repository

`/.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile` and `pnpm verify` when an operator manually dispatches it. `/.github/workflows/background-jobs.yml` accepts the `target` input `all`, `videos`, or `social`, validates the required Supabase configuration, and invokes `pnpm background:jobs`. Neither workflow is an automatic production scheduler.

The current workflow files deliberately configure `pnpm/action-setup@v4` before `actions/setup-node@v4` so that the pnpm cache can be initialized correctly. The production deployment gate is independent of GitHub runner availability.

## Manual recovery procedure

Use the GitHub Actions page only for a deliberate recovery run after confirming that the account-level runner lock has been resolved. Select **Background Jobs**, choose `all`, `videos`, or `social`, and review the queue rows and provider-side results after the run. The current workflow input is named `target`; older instructions using `job_type` are obsolete.

The equivalent CLI command is:

```bash
gh workflow run background-jobs.yml --repo mohamedalaa7785-cpu/Zikr -f target=all
```

For verification, use:

```bash
gh workflow run ci.yml --repo mohamedalaa7785-cpu/Zikr
gh run list --repo mohamedalaa7785-cpu/Zikr --limit 10
```

If GitHub reports that the job was not started because the account is locked due to a billing issue, stop retrying the workflow. Run the same checks locally or rely on the Vercel build gate instead.

## Secrets and security

Production secrets belong in Vercel or Supabase secret storage, not in the repository. GitHub repository secrets are needed only if an operator intentionally uses the manual recovery workflow after runner access is restored. Never print, commit, or move `SUPABASE_SERVICE_ROLE_KEY`, provider tokens, OAuth refresh tokens, or the scheduler secret into client code.

The queue workflow requires the Supabase URL, service-role key, public site URL, and the public Supabase key. Provider credentials are required only for the selected queue and should be added only when that integration is intentionally enabled. The scheduler route itself is protected by the server-side value returned by `get_push_scheduler_secret`; it is not a public cron endpoint.

## Production scheduler verification

The production Supabase database should contain one active job named `zikr-prayer-push-dispatch` with schedule `* * * * *` and one active job named `zikr-video-processing` with the same schedule. The jobs must be visible in `cron.job`, and recent rows in `cron.job_run_details` should show successful executions. Do not create a second job to compensate for a transient provider failure; inspect the worker logs and delivery ledger first.

The prayer worker uses the private VAPID key held in Supabase runtime settings and writes idempotent delivery records. The video route claims pending rows before external side effects and polls persisted HeyGen job IDs before submitting new provider jobs. These controls are part of the production design and must be preserved when changing scheduling.

## Troubleshooting order

When a deployment fails, inspect the Vercel build logs first and reproduce with `pnpm verify`. When a prayer notification fails, inspect the Edge Function logs, the active cron row, the delivery ledger, and the subscription endpoint response. When a video or social queue is stuck, inspect `/api/internal/video-processing` authentication, row status transitions, provider credentials, and the relevant publish log. Do not re-enable an old scheduler before proving that the current owner is disabled.

When an operator needs a local verification run, use the repository’s documented commands:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

Queue processing should be run only in a server-side environment with the required secrets. Do not run a service-role process from a browser or expose its environment variables to a client bundle.

## Migration history note

The prayer scheduler migration is stored locally as `20260814160000_prayer_push_scheduler.sql`, matching the version recorded by the production Supabase migration ledger. The database was not reset or rewritten to correct this naming alignment; only the repository filename and documentation are kept synchronized.

## References

- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Zikr production scheduling runbook](docs/production-scheduling.md)
- [Zikr background jobs runbook](docs/background-jobs.md)
- [Zikr automation completion evidence](docs/automation-and-ci-completion-report.md)

**Last updated:** August 15, 2026
