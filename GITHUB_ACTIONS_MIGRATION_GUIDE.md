# ZIKR automation and GitHub Actions operations

**Status:** Current architecture documented  
**Last updated:** September 15, 2026

## Executive summary

ZIKR uses three separate execution owners:

1. **Vercel build gate** runs `pnpm verify` for every deployment and is responsible for repository/build validation.
2. **Supabase `pg_cron`** owns the minute-level prayer Web Push scheduler.
3. **GitHub Actions `Background Jobs`** owns the automatic video and social queue worker on a 15-minute cadence. The older Supabase `zikr-video-processing` cron was explicitly retired by `20260915004110_retire_vercel_video_processing_cron.sql`.

The GitHub `Continuous Integration` workflow remains manual-only because hosted runners may be unavailable for this account. This is an external account constraint; the YAML does not bypass it.

## Current ownership

| Responsibility | Authoritative owner | Frequency | Production status |
|---|---|---:|---|
| Install, typecheck, lint, tests, route checks, migration replay, and build | Vercel build gate (`pnpm verify`) | Every deployment | Active |
| Prayer Web Push dispatch | Supabase `pg_cron` → `prayer-notification-worker` | Every minute | Active |
| Video generation queue | GitHub `Background Jobs` → `pnpm background:jobs` → template/FFmpeg worker | Every 15 minutes | Active |
| Social publishing queue | GitHub `Background Jobs` → `pnpm background:jobs` → social publisher | Every 15 minutes | Active |
| Manual queue recovery | GitHub `Background Jobs` workflow | On demand | Available when runners can start |
| Manual verification fallback | GitHub `Continuous Integration` workflow | On demand | Available when runners can start |

There must be only one automatic owner for each production queue. Do not re-enable the retired Supabase video cron or add a second Vercel/GitHub schedule for the same workload.

## Workflows in the repository

`/.github/workflows/ci.yml` runs the verification suite when manually dispatched. `/.github/workflows/background-jobs.yml` is the canonical video/social worker and runs on `*/15 * * * *`, with manual `target` values `all`, `videos`, or `social` for controlled recovery.

The background worker is intentionally locked to the free deterministic template renderer. It installs FFmpeg and Arabic fonts on the runner, processes the persisted queue, and publishes through server-side credentials. HeyGen is retained only as historical/legacy schema compatibility and is not selected by the production worker.

## Manual recovery procedure

Use **Background Jobs** only for a deliberate recovery run or targeted queue processing. Select `all`, `videos`, or `social`, verify the required GitHub secrets/variables, and review the resulting queue rows after the run.

The equivalent CLI command is:

```bash
gh workflow run background-jobs.yml --repo Zikrmediaofficial/Zikr -f target=all
```

For verification:

```bash
gh workflow run ci.yml --repo Zikrmediaofficial/Zikr
gh run list --repo Zikrmediaofficial/Zikr --limit 10
```

If GitHub reports that the job cannot start because of an account-level billing/runner restriction, stop retrying the workflow. Run the repository verification locally or use the Vercel build gate.

## Secrets and security

Production secrets belong in Vercel, Supabase, or protected GitHub Actions secrets/variables as appropriate. Never commit or expose `SUPABASE_SERVICE_ROLE_KEY`, provider access tokens, OAuth refresh tokens, or scheduler secrets to client code.

The background worker requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL`. YouTube and Facebook credentials are optional integrations and are validated at runtime before publication. Missing optional provider credentials must result in an explicit skip/failure state, not an alternate service or hardcoded project fallback.

## Video generation and publishing flow

```text
video_generation_requests
        │
        ▼
GitHub Background Jobs (15 min)
        │
        ├── seedAutomatedVideoRequests()
        ├── template FFmpeg renderer
        ├── Supabase Storage
        └── social_publish_queue
                    │
                    ├── YouTube OAuth upload
                    └── Facebook / Reels publish
```

The production renderer is deterministic and does not require a paid AI video provider. Generated files are stored in Supabase Storage and passed to the social queue as direct HTTPS media URLs. YouTube watch URLs are rejected as media sources for republishing.

## Production scheduler verification

The prayer worker remains the only minute-level production scheduler in Supabase. The video/social queue must be processed by the GitHub `Background Jobs` workflow. The legacy `zikr-video-processing` cron was removed from the active database schedule by the retirement migration.

When checking a stuck queue, inspect the GitHub workflow run, queue row status (`pending`/`processing`/`completed`/`failed` as applicable), error message, retry metadata, and provider response. Do not create a second scheduler to compensate for a provider outage.

## Troubleshooting order

For a deployment failure, inspect Vercel logs first and reproduce with `pnpm verify`. For video generation failures, inspect the GitHub Background Jobs run, FFmpeg installation step, Supabase queue/storage response, and the generated request row. For social failures, inspect the queue item, provider credentials, and recorded platform result/error fields.

For local verification:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

Queue processing requires a server-side environment with the required secrets. Never run service-role operations in browser code.

## Migration history note

Historical Supabase migrations are retained as repository history. The retirement migration that disables the old Vercel video-processing cron is additive and idempotent; production migration history must not be reset or rewritten to remove historical records.

## References

- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [ZIKR production scheduling runbook](docs/production-scheduling.md)
- [ZIKR background jobs runbook](docs/background-jobs.md)
