# ZIKR — CircleCI and Supabase environment matrix

**Last updated:** September 19, 2026

This document is the authoritative inventory for the current CircleCI recovery/CI path and the Supabase Edge Function runtime. Secret values must never be committed to Git.

## CircleCI Project / Context variables

### Required for `background-jobs`
- `SUPABASE_URL` — secret/protected.
- `SUPABASE_SERVICE_ROLE_KEY` — secret/protected.
- `NEXT_PUBLIC_SITE_URL` — non-secret; the current job pins this to `https://zikrmediaofficial.vercel.app`.

### Required for `production-smoke`
- `SUPABASE_URL` — protected variable.
- `SUPABASE_ANON_KEY` — public/low-sensitivity runtime key.
- `NEXT_PUBLIC_SITE_URL` — non-secret; pinned by the config.

### Required for `quran-audio-import`
- `SUPABASE_URL` — protected variable.
- `SUPABASE_SERVICE_ROLE_KEY` — secret/protected.

Optional operational values:
- `QURAN_AUDIO_MAX_FILE_MB` (default 50)
- `QURAN_AUDIO_MAX_BUCKET_MIB` (default 800; the importer checks actual bucket usage before upload and reserves headroom for other Storage buckets)
- `QURAN_AUDIO_CONCURRENCY` (default 2)

### Required only for Android release
- `ANDROID_KEYSTORE_BASE64` — secret/protected.
- `ANDROID_KEYSTORE_PASSWORD` — secret/protected.
- `ANDROID_KEY_ALIAS` — protected.
- `ANDROID_KEY_PASSWORD` — secret/protected.
- `GH_TOKEN` — secret/protected with permission to create/update tags and releases in `Zikrmediaofficial/Zikr`.

### Required only when social publishing is deliberately enabled
For YouTube:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

For Facebook:
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `FACEBOOK_GRAPH_API_VERSION` (for example `v26.0`)

The worker refuses to start social publishing without a complete credential set for at least one provider.

## CircleCI values that are configuration, not secrets

These are intentionally defined in `.circleci/config.yml` or supplied as pipeline parameters:
- `BACKGROUND_JOB_TARGET`
- `VIDEO_GENERATOR=template`
- `AUTO_VIDEO_ENABLED=true`
- `AUTO_VIDEO_BATCH_SIZE=1`
- `AUTO_VIDEO_SECONDS=14`
- `VIDEO_BACKGROUND_BATCH_SIZE=3`
- `SOCIAL_BACKGROUND_BATCH_SIZE=10`
- `SOCIAL_PUBLISH_ENABLED=false` by default
- `run_background_jobs`
- `background_target`
- `run_quran_audio_import`
- `run_production_smoke`
- `run_security_audit`

CircleCI also supplies built-in values such as `CIRCLE_SHA1`, `CIRCLE_BRANCH`, and `CIRCLE_TAG`; they must not be manually created as secrets.

## Supabase Edge Function runtime

### `prayer-notification-worker`
The code requires:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `PUSH_CONTACT` (the code falls back to `mailto:admin@zikrmediaofficial.vercel.app`).

The scheduler does not take its bearer secret from an environment variable. The database-backed `scheduler_secret` lives in the private `push_runtime_settings` table and is exposed only through the service-role-only RPC `get_push_scheduler_secret()`.

The VAPID key bundle is also stored in the same private runtime-settings table and is accessed through service-role-only RPCs. Do not add VAPID private material to GitHub, CircleCI, or the repository.

### `source-verified-content-agent`
The code requires:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

External source credentials, when used, are looked up dynamically by the value stored in `content_agent_sources.api_key_secret_name`. Do not invent a fixed secret name; provision exactly the secret name referenced by the production source row.

### `spiritual-ai`
No external API secret is required by the current implementation; the function is protected by bearer/JWT authentication.

### `health`
No project secret is required by the current implementation.

### `sync-youtube-facebook`
This function exists in the repository but is not part of the current `supabase/config.toml` production function configuration. Do not make it part of the active runtime or CircleCI pipeline unless it is intentionally re-enabled. When intentionally enabled, its code expects:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_ID`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `FACEBOOK_GRAPH_API_VERSION`

Its request authentication uses the database `social_sync_state.sync_secret_hash`; that secret is not a repository variable.

## Variables that must stay retired

The current application validation explicitly rejects these as runtime inputs:
- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Google login is configured through Supabase Auth; direct Postgres application URLs are not part of the current runtime.

## Security rule

Never copy secret values into `.circleci/config.yml`, `.env.example`, migrations, SQL, source files, issue comments, or release artifacts. CircleCI must receive secrets from its Project/Context environment store, while Supabase Edge Functions must receive runtime secrets through the Supabase secret/runtime mechanism or the existing protected database-backed settings where the code already uses that pattern.
