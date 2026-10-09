# ZIKR — CircleCI and Supabase environment matrix

**Last updated:** 2026-10-08

This document covers the current CircleCI CI/release lanes and the Supabase Edge Function runtime. GitHub Actions is the production owner for video/social scheduling. CircleCI does not execute the production video/social worker.

## CircleCI

### Application build/documentation

The `application-build-docs` job requires the public build-time Supabase URL/key and canonical production origin, then runs:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm ci:build:report
```

### Android release

`android-rebuild` pins these non-secret build settings in `.circleci/config.yml`:

- `NEXT_PUBLIC_SUPABASE_URL=https://wvetcauyerlkqvmntajq.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the public anon key; it is not a service-role secret)
- `SUPABASE_URL=https://wvetcauyerlkqvmntajq.supabase.co`

The following values must exist as protected CircleCI project environment variables before the Android job starts:

- `SUPABASE_SERVICE_ROLE_KEY` (required only for the server-side asset upload and `android_release` site-setting update)
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The job fails early and lists the missing variable names without printing their values. Do not move the signing material or service-role key into the repository or a public workflow file.

The Android release lane uses one semantic tag (`vX.Y.Z`). There is no `-build` parallel tag.

### English content synchronization

CircleCI owns the recurring English article/Hadith synchronization schedule. GitHub keeps a manual fallback workflow only.

### Security and Supabase gates

CircleCI also runs the release-specific Supabase production gate and manual security audit. It does not execute `scripts/run-background-jobs.ts` for production video/social processing.

## GitHub Actions

Production video/social credentials and schedules live in protected GitHub environments:

- `generate-ai-video.yml` — recurring video generation.
- `publish-social.yml` — recurring social publishing.
- `release-finalization.yml` — controlled production web release.

## Supabase Edge Functions

### `prayer-notification-worker`

Requires the canonical Supabase URL/service-role runtime. Its scheduler secret and VAPID configuration remain database-backed through protected RPCs.

### `source-verified-content-agent`

Uses the configured production content sources and protected service-role runtime. Its cron is owned by Supabase pg_cron.

### `spiritual-ai`

Request-driven authenticated function; it is not a scheduler.

### `health`

Request-driven health endpoint; it is not a scheduler.

The retired `sync-youtube-facebook` Edge Function is not part of the active runtime tree. The legacy pg_cron record remains disabled for migration/history compatibility only.

## Repository rules

Never place secret values in repository files. Keep service-role keys, OAuth refresh tokens, Page access tokens, Android signing material, and GitHub dispatch tokens in protected runtime secret stores.
