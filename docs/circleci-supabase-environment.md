# ZIKR — CircleCI and Supabase environment matrix

**Last updated:** 2026-11-01

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

- `NEXT_PUBLIC_SUPABASE_URL=https://ymxdswkaxafakugktsim.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the public anon key; it is not a service-role secret)
- `SUPABASE_URL=https://ymxdswkaxafakugktsim.supabase.co`

The following values must be available before the Android job starts:

- `SUPABASE_SERVICE_ROLE_KEY` — CircleCI project environment variable (required for the server-side asset upload and `android_release` site-setting update)
- `ANDROID_KEYSTORE_BASE64` — CircleCI context `android-signing`
- `ANDROID_KEYSTORE_PASSWORD` — CircleCI context `android-signing`
- `ANDROID_KEY_ALIAS` — CircleCI context `android-signing`
- `ANDROID_KEY_PASSWORD` — CircleCI context `android-signing`
- `GH_TOKEN` — CircleCI context `android-signing` (fine-grained token for the guarded GitHub Actions dispatch)

The `android-rebuild` workflow attaches the `android-signing` context for the four protected signing variables. The follow-up `android-release-dispatch` job uses the same context and additionally requires `GH_TOKEN` to dispatch the guarded GitHub recovery workflow after the signed build succeeds. The context must exist in the CircleCI organization and be authorized for this project before the release workflow is run. Keep signing material, service-role credentials, and the GitHub token out of the repository.

The Android jobs fail early and list missing variable names without printing their values. `GH_TOKEN` must be a protected fine-grained GitHub token scoped to this repository with Actions write, Contents read, and commit-status read permissions. Do not move the signing material, service-role key, or GitHub token into the repository or a public workflow file.

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
