# ZIKR CI/CD Architecture — 2026-10-08

## Ownership model

GitHub Actions owns pull-request/main source verification, controlled releases, and deliberate manual video dispatch. CircleCI owns recurring video/social and English-content schedules so periodic production work does not consume the GitHub Free Actions allowance.

CircleCI is retained for recurring background processing, Android release execution, explicit recovery, and manual security audit work. It must not become a second automatic source-verification owner.

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
| Scheduled automation | CircleCI Video/English schedules | Operational; never a PR merge gate |

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
 └── full canonical verify
       ├── migration replay
       ├── mobile readiness
       └── production build

scheduled production jobs
 └── CircleCI
       ├── video/social: 03:17, 09:17, 15:17, 21:17 UTC
       └── English content: 04:17 UTC

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

`ci:architecture:check` protects the automation topology itself from schedule drift, duplicated owners, confusing check names, and missing production environment guards. It also enforces that GitHub Actions has no recurring `schedule` triggers; recurring production jobs belong to CircleCI.

## Non-goals

No secret values are stored in the repository. No Vercel Cron is reintroduced. No recurring GitHub Actions `schedule` trigger is reintroduced. No production deployment is triggered merely because this branch or PR exists. No production Supabase migration is executed as part of the CI architecture refactor.
