# Zikr deployment checklist

**Canonical production URL:** `https://zikrmediaofficial.vercel.app`

This checklist reflects the current production architecture. GitHub Actions owns repository quality checks, recurring video generation, social publishing, controlled releases, and production smoke verification; CircleCI owns the application build/documentation lane, Android/recovery operations, and English-content scheduling; Vercel is release infrastructure; Supabase owns prayer scheduling.

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
| GitHub Actions | Verification, recurring video generation, social publishing, and release secrets are configured in the protected production environment |
| CircleCI Android | Android release variables are protected; release branches/tags are used only for release builds |

## Production automation

Video production is the scheduled GitHub Actions `generate-ai-video.yml` workflow. It runs four times daily, seeds source-locked requests, renders with AI/FFmpeg, validates the output, and stores the result in Supabase Storage. Social publishing is handled separately by GitHub Actions `publish-social.yml` every 15 minutes. Do not add a Vercel Cron, Supabase video cron, or CircleCI worker for these queues.

## Vercel deployment

Confirm that `vercel.json` uses `pnpm install --frozen-lockfile` and `pnpm build`. Push the intended commit to `main`, then verify that the resulting production deployment is `READY`, points to the intended commit, and serves `zikrmediaofficial.vercel.app` without password protection.

The custom production domain must remain reachable for OAuth callbacks. Non-custom preview protection may remain enabled. Do not treat a preview deployment as production evidence.

## CircleCI

The committed `.circleci/config.yml` owns the application build/documentation lane and release-specific recovery operations.

- Source/architecture verification is owned by GitHub Actions `ZIKR / Quality Gate` on PRs and `main`.
- CircleCI `source-verify` runs only as a release/Android prerequisite; it does not duplicate the main quality gate.
- `application-build-docs` produces the certified web build/documentation artifact.
- Android release runs only for release branches/tags and validates signing material.
- Video/social production is not executed by CircleCI.
- Quran audio import is intentionally absent; Quran audio remains externalized.
- Security audit is opt-in through `run_security_audit`.

Protect all production credentials in CircleCI Project or Context environment variables. Do not put secrets in `.circleci/config.yml`.

## Supabase schema and security

Confirm that the production migration ledger contains the same versions as the repository. Do not reset production migration history or create duplicate filenames merely to satisfy preview checks.

Confirm that all public tables holding user or operational data have RLS enabled, that owner policies use `auth.uid()`, that admin policies call the server-side admin helper, and that scheduler tables do not expose private keys or secrets. The service-role key must be used only in protected server environments.

## Authentication and Google OAuth

Verify email sign-in, registration, password recovery, logout, session persistence, and protected-route redirects. Verify Google sign-in from the canonical domain and confirm that the callback returns to the application route, not the Supabase provider callback.

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

## Failure handling

When Vercel fails, inspect build logs and reproduce with `pnpm verify`. When a runtime route fails, inspect the latest deployment's runtime errors and logs, then reproduce the route. When Supabase fails, inspect Edge Function logs, `cron.job_run_details`, RLS policies, and the relevant table rows.

For video/social failures, inspect the GitHub Actions worker, queue row state, FFmpeg step, storage result, and provider response. Do not weaken RLS, remove authentication, or add a second scheduler to make a check pass.

## Release evidence

Record the deployed commit SHA, Vercel deployment URL and state, GitHub worker/release run identifier, CircleCI build artifact identifier, source verification output, migration counts, active cron jobs, recent cron results, and any unresolved advisor warnings.

A deployment is not considered fully validated solely because the Vercel state is `READY`; the smoke checks and scheduler evidence are required as well.

**Last updated:** October 8, 2026
