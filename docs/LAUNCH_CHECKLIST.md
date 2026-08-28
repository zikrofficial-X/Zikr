# Zikr production launch checklist

Use this checklist before promoting a release. Keep real credentials only in local `.env.local` for development and in Vercel/Supabase server-side secret stores for production. Do not commit secrets or copy service-role credentials into browser-side tests.

## Local verification

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm deploy:check
```

The lockfile must remain unchanged after installation. The verification suite is also the Vercel build gate.

## Vercel configuration

The project must be linked to the `zikr` Vercel project and the canonical domain must be `https://zikrmediaofficial.vercel.app`. Confirm that the build uses `pnpm install --frozen-lockfile` and `pnpm verify`, that the latest production deployment is `READY`, and that the custom domain is not password protected.

Set the required public and server-side variables in the correct Vercel environments. The public Supabase URL and anon/publishable key may be exposed to the browser; the service-role key, OAuth client secret, provider tokens, VAPID private key, and scheduler secret must remain server-only. Optional integrations should be configured only when their feature is intentionally enabled.

## Supabase readiness

Confirm that the production project is healthy and that the local migration filenames match the remote migration versions. The scheduler migration is locally stored as `20260814160000_prayer_push_scheduler.sql`, matching the production version. Do not reset production or apply a duplicate migration to repair a name-only discrepancy.

Verify that all user and operational tables have RLS enabled. Owner policies must use `auth.uid()`, admin policies must call the server-side admin helper, and scheduler tables must not have public read or write access. Confirm that the service-role key is used only in server-side code.

## Scheduler readiness

Confirm exactly one active row for each production job:

| Job | Schedule | Target |
|---|---:|---|
| `zikr-prayer-push-dispatch` | `* * * * *` | `prayer-notification-worker` |
| `zikr-video-processing` | `* * * * *` | `/api/internal/video-processing` |

Review recent `cron.job_run_details` rows and Edge Function/runtime logs. The prayer worker must use the delivery ledger and private VAPID settings. The video route must reject requests without its scheduler bearer secret and must claim queue rows before external provider side effects.

## Authentication and OAuth

Verify email registration, login, logout, password recovery, session refresh, protected-route redirects, and Google sign-in. Google Cloud and Supabase provider configuration must allow the canonical application callback `https://zikrmediaofficial.vercel.app/auth/callback`. The application’s Google initiation route must redirect to that app route and must not use the Supabase provider callback as its `redirectTo` value.

Test the flow from the canonical domain in a real browser session. Do not record or commit the account password or OAuth tokens in project files.

## Smoke tests

After deployment, verify that these routes load and do not emit unexpected console or server errors:

```text
/
/auth/login
/auth/register
/quran
/quran/1
/hadith
/dua
/prayer-times
/qibla
/search
/settings
/profile
/api/push/public-key
```

When signed out, `/profile` and other private surfaces must require authentication. The public push-key route may return only the public VAPID key. An unauthenticated subscription write must return `401`; an authenticated write must be associated with the authenticated user and must not allow a caller to choose another `user_id`.

## Post-deployment evidence

Record the deployed commit SHA, Vercel deployment state, the `pnpm verify` result, the remote/local migration counts, the active cron job names, recent cron run results, Supabase advisor warnings, and Vercel runtime error results. A `READY` deployment alone is not proof that authentication, RLS, schedulers, or core routes are healthy.

## GitHub Actions constraint

The repository contains manual-only `ci.yml` and `background-jobs.yml` workflows. They are recovery and verification paths, not production schedules. GitHub currently blocks hosted runners because of an account-level billing lock. Do not restore `schedule` triggers or move production secrets into GitHub merely to make the workflows appear active. Use the Vercel build gate and Supabase cron until the external lock is resolved.

**Last updated:** August 15, 2026
