# ZIKR — CircleCI and Supabase environment matrix

**Last updated:** September 29, 2026

This document is the authoritative inventory for the current CircleCI recovery/CI path and the Supabase Edge Function runtime. Secret values must never be committed to Git.

## CircleCI Project / Context variables

### Required for `background-jobs`
- `SUPABASE_URL` — secret/protected.
- `SUPABASE_SERVICE_ROLE_KEY` — secret/protected.
- `NEXT_PUBLIC_SITE_URL` — non-secret; the current job pins this to `https://zikrmediaofficial.vercel.app`.

### Required only for Android release
- `ANDROID_KEYSTORE_BASE64` — secret/protected.
- `ANDROID_KEYSTORE_PASSWORD` — secret/protected.
- `ANDROID_KEY_ALIAS` — protected.
- `ANDROID_KEY_PASSWORD` — secret/protected.
- `GH_TOKEN` — secret/protected with permission to create/update tags and releases in `zikr-org/Zikr`.

## Release/runtime rules

- CircleCI checks out `zikr-org/Zikr` through the connected CircleCI project.
- Android release assets must be published back to `zikr-org/Zikr`.
- Production scheduling remains owned by Supabase `pg_cron` / Edge Functions.
- Never put secret values in `.circleci/config.yml`.

## Supabase Edge Function runtime

The protected runtime values remain project secrets / private database-backed settings as already implemented by the functions. Do not move them into Git.

## Variables that must stay retired

The current application validation explicitly rejects:

- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Google login is configured through Supabase Auth; direct Postgres application URLs are not part of the current runtime.

## Security rule

Never copy secret values into `.circleci/config.yml`, `.env.example`, migrations, SQL, source files, issue comments, or release artifacts.
