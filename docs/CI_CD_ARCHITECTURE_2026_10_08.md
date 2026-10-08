# ZIKR CI/CD Architecture — 2026-10-08

## Ownership model

GitHub Actions owns pull-request/main source verification, recurring video generation, recurring social publishing, controlled releases, and deliberate manual recovery dispatches.

CircleCI is retained for the application build/documentation artifact, Android release execution, recurring English-content sync, Supabase release gates, explicit recovery, and manual security audit work. It must not execute the production video/social worker.

Supabase pg_cron remains the owner of minute-level prayer notification scheduling.

Vercel is the deployment target. The controlled release workflow performs the production build/deploy and then verifies the exact deployment before writing release evidence.

## Check taxonomy

| Check family | Example | Blocking intent |
|---|---|---|
| Source gate | `ZIKR / Quality Gate` | Blocking |
| Production data health | `ZIKR Supabase Production Health` | Blocking for production release confidence |
| Production smoke | `ZIKR Production Smoke Verification` | Blocking on controlled release |
| Android | Android build/signature/publish verification | Blocking for Android release only |
| Security | CircleCI `security-audit` | Advisory/manual outside PR source gate |
| Scheduled automation | GitHub video/social + CircleCI English + Supabase prayer/source agent | Operational; never a PR merge gate |

The canonical PR source check must be named `ZIKR / Quality Gate`; it must never use a CircleCI-looking name.

## Release flow

```text
PR
 └── ZIKR / Quality Gate
       ├── schema contracts
       ├── video contracts
       ├── scheduler
       ├── content/auth/security
       ├── lint
       └── TypeScript

main
 ├── ZIKR / Quality Gate (verification)
 └── CircleCI application-build-docs (production build + evidence)

scheduled production jobs
 ├── GitHub Actions
 │    ├── video: 03:17, 09:17, 15:17, 21:17 UTC
 │    └── social: every 15 minutes
 ├── CircleCI
 │    └── English content: 04:17 UTC
 └── Supabase pg_cron
      ├── prayer: every minute
      └── source agent: 03:00 UTC

manual production release
 └── release-finalization
       ├── exact main commit
       ├── production flag
       ├── verify:pr
       ├── Vercel build
       ├── Vercel deploy
       └── deployed-artifact smoke test

Android release
 └── CircleCI tagged/release branch build
       ├── signed APK/AAB
       ├── checksum verification
       └── GitHub publish workflow
```

## Contract gates

`schema:contract:check` protects application/database boundaries that have historically produced runtime failures.

`video:contract:check` protects the video status/category/TTS contracts against database constraint drift.

`ci:architecture:check` protects the automation topology itself from schedule drift, duplicated owners, confusing check names, and missing production environment guards. It enforces the single-owner rules documented in the canonical automation ownership map.

## Non-goals

No secret values are stored in the repository. No Vercel Cron is reintroduced. No recurring GitHub Actions `schedule` trigger is reintroduced. No production deployment is triggered merely because this branch or PR exists. No production Supabase migration is executed as part of the CI architecture refactor.
