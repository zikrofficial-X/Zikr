# Zikr deployment checklist

**Canonical production URL:** `https://zikrmediaofficial.vercel.app`

This checklist reflects the current production architecture. GitHub Actions are retired from the active repository. CircleCI provides external CI/recovery jobs, Vercel provides deployment/build validation, and Supabase owns production scheduling.

## Before deployment

| Area | Required verification |
|---|---|
| Repository | Working tree is intentional; `pnpm-lock.yaml` is committed; no secrets or generated files are staged |
| Dependencies | `pnpm install --frozen-lockfile` completes without modifying the lockfile |
| Verification | `pnpm verify` passes locally or through CircleCI |
| Vercel | Project `zikr` uses Next.js and runs the production build gate |
| Supabase | Production project is `ACTIVE_HEALTHY`; local and remote migration versions match |
| Authentication | Supabase redirect URLs and Google OAuth credentials use the canonical production callback `/auth/callback` |
| Secrets | Service-role, OAuth refresh, provider, VAPID, and scheduler secrets exist only in server-side stores |
| CircleCI Android | Android release variables are protected; release branches/tags are used only for release builds |

## Vercel deployment

Confirm that `vercel.json` uses `pnpm install --frozen-lockfile` and `pnpm build`. Push the intended commit to `main`, then verify that the resulting production deployment is `READY`, points to the intended commit, and serves `zikrmediaofficial.vercel.app` without password protection.

The custom production domain must remain reachable for OAuth callbacks. Non-custom preview protection may remain enabled. Do not treat a preview deployment as production evidence.

## CircleCI

The committed `.circleci/config.yml` owns the external CI/recovery path.

- Source changes run `ci-check`.
- Android release runs only for release branches/tags and validates signing material.
- Background video/social processing is opt-in through `run_background_jobs`.
- Quran audio import is opt-in through `run_quran_audio_import`.
- Security audit is opt-in through `run_security_audit`.

Protect all production credentials in CircleCI Project or Context environment variables. Do not put secrets in `.circleci/config.yml`.

## Supabase schema and security

Confirm that the production migration ledger contains the same versions as the repository. The prayer scheduler migration is locally named `202609...`, matching the production version recorded in `supabase_migrations.schema_migrations`; do not apply a duplicate migration merely to rename a ledger entry.

Confirm that all public tables holding user or operational data have RLS enabled, that owner policies use `auth.uid()`, that admin policies call the server-side admin helper, and that scheduler tables do not expose private keys or secrets. The service-role key must be used only in server-side route handlers, server actions, workers, CircleCI recovery jobs, or equivalent protected server environments.

## Production schedulers

Confirm that `cron.job` contains exactly one active prayer job and zero active rows for the retired video job.

| Job | Schedule | Target |
|---|---:|---|
| `zikr-prayer-push-dispatch` | `* * * * *` | `prayer-notification-worker` Edge Function |
| `zikr-video-processing` | retired | none |

Do not add or restore a scheduler for the retired video path.

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

The public push-key endpoint may return only the VAPID public key. An unauthenticated subscription write must return `401`; an authenticated subscription write must be scoped to the current user.

## Failure handling

When Vercel fails, inspect build logs and reproduce with `pnpm verify`. When a runtime route fails, inspect the latest deployment's runtime errors and logs, then reproduce the route. When Supabase fails, inspect Edge Function logs, `cron.job_run_details`, RLS policies, and the relevant table rows.

For video/social failures, inspect the CircleCI job, queue row state, FFmpeg step, storage result, and provider response. Do not weaken RLS, remove authentication, or add a second scheduler to make a check pass.

## Release evidence

Record the deployed commit SHA, Vercel deployment URL and state, CircleCI job/pipeline identifier, `pnpm verify` output, migration counts, active cron jobs, recent cron results, and any unresolved advisor warnings.

A deployment is not considered fully validated solely because the Vercel state is `READY`; the smoke checks and scheduler evidence are required as well.

**Last updated:** September 20, 2026
