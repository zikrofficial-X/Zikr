# ZIKR — GitHub Actions retirement and CircleCI migration

## Current state

GitHub Actions has been removed from the active ZIKR repository because the account-level GitHub-hosted runner billing restriction was preventing workflow startup.

The active architecture is now:

- **GitHub:** source control, pull requests, releases, and repository metadata.
- **CircleCI:** external CI and controlled recovery/build jobs.
- **Vercel:** production web deployment and deployment-time build validation.
- **Supabase:** production database, Edge Functions, and minute-level scheduled jobs through `pg_cron`.

The `.github/workflows/` directory is intentionally absent from `main`.

## What was migrated

The previous repository workflows were converted into CircleCI jobs in `.circleci/config.yml`:

| Former GitHub workflow | CircleCI replacement | Trigger |
|---|---|---|
| Continuous Integration | `ci-check` | Normal source-change pipeline |
| Background Jobs | `background-jobs` | Explicit pipeline parameter |
| Import Quran Audio | `quran-audio-import` | Explicit pipeline parameter |
| Android Build | `android-rebuild` | Release branch/tag only |
| Production Smoke Test | `production-smoke` | Explicit pipeline parameter |
| Security Audit | `security-audit` | Explicit pipeline parameter |

No production secret is required for the standard `ci-check` job.

## Operational controls

Operational jobs are **disabled by default** so a normal push does not unexpectedly start expensive or privileged workloads.

Parameters exposed by CircleCI:

```text
run_background_jobs=false
background_target=all
run_quran_audio_import=false
run_production_smoke=false
run_security_audit=false
```

To run a recovery job, trigger a CircleCI pipeline with the required parameter set. Only protected CircleCI project/context variables should contain service-role keys, OAuth credentials, provider access tokens, or signing material.

## Production ownership

Prayer Web Push remains owned by Supabase `pg_cron` and the `prayer-notification-worker` Edge Function.

The retired `zikr-video-processing` Supabase cron must not be recreated. Video/social queue recovery is executed through CircleCI when deliberately triggered.

The Vercel build gate remains the deployment validation path. The CircleCI `ci-check` provides an independent repository verification path.

## Security

Secrets are never committed to the repository. CircleCI receives protected values through its project/context environment-variable store; the committed configuration contains only variable names and non-sensitive defaults.

Android release signing uses protected CircleCI variables and removes generated signing files at job completion. The repository contains no release keystore.

## Billing

Removing GitHub workflows prevents new repository workflow executions from consuming GitHub-hosted runner capacity. It does **not** erase historical GitHub Actions usage, invoices, or an account-level billing restriction.

CircleCI has a separate credit/quota system. Keep operational jobs opt-in and review the account's displayed allowance before enabling high-frequency execution.

## Validation checklist

1. Confirm GitHub `.github/workflows/` is absent.
2. Confirm CircleCI reads `.circleci/config.yml`.
3. Confirm the CircleCI `ci-check` status appears on the repository commit.
4. Confirm protected secrets exist in CircleCI before enabling background or release jobs.
5. Keep Supabase as the only automatic owner for minute-level prayer scheduling.
6. Do not reintroduce GitHub Actions workflows unless the execution model is intentionally changed and reviewed.

## Historical records

Older audit reports and migration notes may still mention GitHub Actions. Those files are historical evidence and are not active execution configuration.

**Last updated:** September 19, 2026
