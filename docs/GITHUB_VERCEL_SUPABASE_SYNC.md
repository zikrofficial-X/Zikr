# GitHub + Vercel + Supabase Sync Guide

This document describes the current integration between the canonical GitHub repository, the linked Vercel project, and Supabase.

## Architecture

```
GitHub: Zikrmediaofficial/Zikr
        |
        +--> Vercel project: zikr
        |      |
        |      +--> Next.js build: pnpm install --frozen-lockfile
        |      +--> Production build: pnpm build
        |      +--> Canonical public origin: https://zikrmediaofficial.vercel.app
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

`Zikrmediaofficial/Zikr`

The canonical production branch is:

`main`

The linked Vercel project is:

`zikr`

Production deployment is expected to build from the connected GitHub repository. Finalization branches such as `finalization-src-20260920` are review branches and must not be treated as production evidence until their deployment is verified.

## 2. Vercel environment

Required application variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service-role credential |
| `NEXT_PUBLIC_SITE_URL` | Locked canonical origin: `https://zikrmediaofficial.vercel.app` |
| `AUTH_CALLBACK_URL` | Locked application callback: `https://zikrmediaofficial.vercel.app/auth/callback` |

Optional provider variables are configured only when their feature is enabled, for example YouTube, Facebook, Gemini, and Cloudinary integrations.

Google sign-in provider credentials belong in Supabase Authentication → Sign In / Providers → Google. They are not application runtime credentials for the Supabase Auth flow.

## 3. Supabase

The canonical database schema lives only under:

`supabase/migrations/`

Do not use a direct `DATABASE_URL` runtime connection or a second ORM schema-push mechanism.

Supabase Auth application redirects are locked to:

- `com.zikr.app://auth/callback`
- `http://localhost:3000/**`
- `https://zikrmediaofficial.vercel.app/auth/callback`

The Google provider redirect URI is the Supabase provider callback:

`https://eydxvcamhjhajxjrsgym.supabase.co/auth/v1/callback`

These are separate by design.

## 4. Database migrations

Use the canonical Supabase migration process from an authenticated environment:

```bash
pnpm db:migrate-supabase
```

For local verification:

```bash
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
```

For the complete repository gate:

```bash
pnpm verify
```

Vercel production uses `pnpm install --frozen-lockfile` and `pnpm build`. A successful local check does not replace production deployment verification.

## 6. Deployment flow

Push verified changes through the intended GitHub branch/PR process. The linked Vercel project can automatically create a preview deployment for source branches and a production deployment for `main`.

When an environment variable is changed in Vercel, a new deployment is required before the running application receives the updated value.

Do not use an arbitrary Vercel deployment alias as the canonical OAuth or metadata origin.

## 7. Runtime architecture

The web application is organized as:

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

Authenticated checks should also cover profile, favorites, memorization, reminder preferences, admin protection, and native OAuth on a real device.

## 9. CI and background jobs

GitHub Actions workflows are retired from the active repository.

CircleCI owns external CI/recovery jobs, including:

- `ci-check`
- opt-in background video/social jobs
- opt-in Quran audio import
- opt-in production smoke
- opt-in security audit
- release-specific Android validation

Supabase `pg_cron` owns the minute-level prayer notification worker.

Do not add a second scheduler for the same workload.

## 10. Troubleshooting

### Vercel build fails
Inspect the current deployment's build result first. The finalization branch currently has an external Vercel build-rate-limit/account blocker; older READY production deployments are not evidence for this branch.

### Supabase is unreachable
Verify the project is healthy and the required environment variables are present. Live SQL/RLS validation must run with an authenticated Supabase project.

### OAuth fails
Verify the exact application callback and Supabase provider callback listed above. Never use a Vercel preview hostname as the production callback.

### Database migration fails
Use only `supabase/migrations/` and inspect the migration ledger before applying any repair. Never mark an unseen migration as applied just to make deployment green.

## 11. Security

Never commit:

- Supabase service-role keys
- Google OAuth client secrets
- YouTube refresh tokens
- Facebook Page access tokens
- VAPID private keys
- Android signing keys
- iOS signing material

If a secret was exposed in Git history or logs, rotate it at the owning provider; deleting the current file is not sufficient.
