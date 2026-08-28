# Zikr deployment checklist

**Canonical production URL:** `https://zikrmediaofficial.vercel.app`

This checklist reflects the current production architecture. GitHub Actions is manual-only while the account-level hosted-runner billing lock remains. It is not the production scheduler.

## Before deployment

| Area | Required verification |
|---|---|
| Repository | Working tree is intentional; `pnpm-lock.yaml` is committed; no secrets or generated files are staged |
| Dependencies | `pnpm install --frozen-lockfile` completes without modifying the lockfile |
| Verification | `pnpm verify` passes locally |
| Vercel | Project `zikr` uses Next.js and the build gate runs `pnpm verify` |
| Supabase | Production project is `ACTIVE_HEALTHY`; local and remote migration versions match |
| Authentication | Supabase redirect URLs and Google OAuth credentials use the canonical production callback `/auth/callback` |
| Secrets | Service-role, OAuth refresh, provider, VAPID, and scheduler secrets exist only in server-side stores |

## Vercel deployment

Confirm that `vercel.json` uses `pnpm install --frozen-lockfile` and `pnpm verify`. Push the intended commit to `main`, then verify that the resulting production deployment is `READY`, points to the intended commit, and serves `zikrmediaofficial.vercel.app` without password protection.

The custom production domain must remain reachable for OAuth callbacks. Non-custom preview protection may remain enabled. Do not treat a preview deployment as production evidence.

## Supabase schema and security

Confirm that the production migration ledger contains the same versions as the repository. The prayer scheduler migration is locally named `20260814160000_prayer_push_scheduler.sql`, matching the production version recorded in `supabase_migrations.schema_migrations`; the production ledger records its name as null, so do not apply a duplicate migration to rename it.

Confirm that all public tables holding user or operational data have RLS enabled, that owner policies use `auth.uid()`, that admin policies call the server-side admin helper, and that scheduler tables do not expose private keys or secrets. The service-role key must be used only in server-side route handlers, server actions, or workers.

## Production schedulers

Confirm that `cron.job` contains exactly one active job for each name below and that recent `cron.job_run_details` rows are successful:

| Job | Schedule | Target |
|---|---:|---|
| `zikr-prayer-push-dispatch` | `* * * * *` | `prayer-notification-worker` Edge Function |
| `zikr-video-processing` | `* * * * *` | `/api/internal/video-processing` |

Do not add a GitHub schedule or a Vercel Cron entry for either path. The prayer worker uses the private VAPID configuration and an idempotent delivery ledger. The video route uses a private scheduler bearer secret and conditional queue claims.

## Authentication and Google OAuth

Verify email sign-in, registration, password recovery, logout, session persistence, and protected-route redirects. Verify Google sign-in from the canonical domain and confirm that the callback returns to the application route, not the Supabase provider callback. The Google initiation route must request only the scopes required by the application and must not expose client secrets.

## Critical production smoke checks

Verify the following public or authenticated surfaces after deployment:

```text
/
/auth/login
/auth/register
/quran
/hadith
/duas
/prayer-times
/qibla
/settings
/api/push/public-key
```

The public push-key endpoint may return only the VAPID public key. An unauthenticated subscription write must return `401`; an authenticated subscription write must be scoped to the current user. Do not test push delivery by inserting rows directly as an anonymous user.

## Failure handling

When Vercel fails, inspect build logs and reproduce with `pnpm verify`. When a runtime route fails, inspect the latest deployment’s runtime errors and logs, then reproduce the route. When Supabase fails, inspect Edge Function logs, `cron.job_run_details`, RLS policies, and the relevant table rows. Do not weaken RLS, remove authentication, or add a second scheduler to make a check pass.

If GitHub reports that a runner was not started because the account is locked due to a billing issue, record it as an external constraint. Use the Vercel build gate and local verification until GitHub runner access is restored.

## Release evidence

Record the deployed commit SHA, Vercel deployment URL and state, `pnpm verify` output, migration counts, active cron jobs, recent cron results, and any unresolved advisor warnings. A deployment is not considered fully validated solely because the Vercel state is `READY`; the smoke checks and scheduler evidence are required as well.

**Last updated:** August 15, 2026
