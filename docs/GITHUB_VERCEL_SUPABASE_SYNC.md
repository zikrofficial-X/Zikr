# GitHub + Vercel + Supabase Sync Guide

This document describes the current integration between the canonical GitHub repository, the linked Vercel project, and Supabase.

## Architecture

```
GitHub: zikrcontact-del/Zikr
        |
        +--> Vercel project: zikr
        |      |
        |      +--> Next.js build: pnpm install --frozen-lockfile
        |      +--> Production build: pnpm build
        |      +--> Canonical public origin: https://zikrmediaofficial.vercel.app
        |
        +--> GitHub Actions
        |      +--> PR/main quality gate
        |      +--> controlled Vercel release + smoke verification
        |      +--> manual video dispatch
        |
        +--> CircleCI
        |      +--> recurring video/social processing
        |      +--> daily English content sync
        |      +--> Android release + recovery operations
        |
        +--> Supabase
               +--> PostgreSQL / RLS
               +--> Auth
               +--> Storage
               +--> Edge Functions
               +--> pg_cron prayer scheduling

Mobile:
  Capacitor Android/iOS -> https://zikrmediaofficial.vercel.app
```

## 1. GitHub and Vercel

The canonical repository is:

`zikrcontact-del/Zikr`

The canonical production branch is:

`main`

The linked Vercel project is:

`zikr`

Production deployment is expected to build from the connected GitHub repository.

## 2. Vercel environment

Required application variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service-role credential |
| `NEXT_PUBLIC_SITE_URL` | Locked canonical origin: `https://zikrmediaofficial.vercel.app` |
| `AUTH_CALLBACK_URL` | Locked application callback: `https://zikrmediaofficial.vercel.app/auth/callback` |

## 3. Supabase

The canonical database schema lives only under:

`supabase/migrations/`

The current application callback is:

`https://zikrmediaofficial.vercel.app/auth/callback`

## 4. Database migrations

Use:

```bash
pnpm db:migrate-supabase
pnpm supabase:migrations:check
pnpm supabase:migrations:replay
```

Never reset production migration history just to reconcile a local branch or filename.

## 5. Verify configuration

Before promotion:

```bash
pnpm deploy:check
pnpm check
pnpm build
pnpm verify
```

## 6. Deployment flow

Push verified changes through the intended GitHub branch/PR process. Production deployment is controlled by `.github/workflows/release-finalization.yml`; preview/production evidence must follow the explicit release policy.

When an environment variable is changed in Vercel, a new deployment is required before the running application receives the updated value.

## 7. Runtime architecture

- `src/app/` — pages, layouts, API route handlers, and route-local server actions.
- `src/features/` — canonical domain services, components, hooks, types, data, and integrations.
- `src/components/` — shared UI and application shell.
- `src/lib/` — shared infrastructure only.
- `supabase/functions/` — Edge Functions.
- `scripts/` — verification/import/recovery tooling.
- `android/`, `ios/`, `mobile/` — native project and mobile metadata.
- `public/` — static/PWA/offline assets.

## 8. Verification after deployment

Verify the latest deployment is `READY`, points to the intended commit, and serves the canonical production origin.

Then smoke-check:

```text
/
/auth/login
/auth/register
/quran
/hadith
/dua
/prayer-times
/qibla
/search
/settings
/api/push/public-key
```

## 9. CI and background jobs

GitHub Actions is the normal scheduled owner of the video/social worker.

CircleCI remains the canonical source-verification, Android-release, security-audit, and manual-recovery environment. Its background-jobs parameter can be used deliberately for recovery; it must not become a second automatic scheduler.

Supabase `pg_cron` owns the minute-level prayer notification worker.

## 10. Security

Never commit:

- Supabase service-role keys
- Google OAuth client secrets
- YouTube refresh tokens
- Facebook Page access tokens
- VAPID private keys
- Android signing keys
- iOS signing material

If a secret was exposed in Git history or logs, rotate it at the owning provider; deleting the current file is not sufficient.
