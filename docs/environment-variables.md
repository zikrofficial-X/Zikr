# ZIKR Environment Variables

Last reconciled: **2026-10-02**

This document describes the current environment contract for the web application, GitHub Actions/background workers, CircleCI recovery jobs, and Supabase Edge Functions.

Secret values are never stored in Git. This repository documents variable **names, ownership, scope, and validation rules** only.

## 1. Canonical web/runtime variables

These are the variables required by the Next.js application.

| Variable | Scope | Required | Notes |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | Canonical project: `https://kdotmrjfecgafiommzwz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Yes | Public/publishable Supabase client credential |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Yes | Never expose to browser/client code |
| `NEXT_PUBLIC_SITE_URL` | Public | Yes | Locked canonical origin: `https://zikrmediaofficial.vercel.app` |
| `AUTH_CALLBACK_URL` | Server/config | Yes | Locked application callback: `https://zikrmediaofficial.vercel.app/auth/callback` |

The application treats `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the browser-facing canonical name. `SUPABASE_ANON_KEY` is retained only as a server/worker compatibility alias.

## 2. Optional application integrations

| Variable | Scope | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Server | Gemini AI |
| `GEMINI_MODEL` | Server | Gemini model override; current default is `gemini-3.1-flash-lite` |
| `HADITH_API_BASE_URL` | Server | External Hadith fallback |
| `CLOUDINARY_CLOUD_NAME` | Server | Cloudinary account |
| `CLOUDINARY_API_KEY` | Server | Cloudinary API |
| `CLOUDINARY_API_SECRET` | Server | Cloudinary secret |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public | Google Analytics |
| `NEXT_PUBLIC_GTM_ID` | Public | Google Tag Manager |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Public | AdSense publisher identifier |
| `AI_GATEWAY_API_KEY` | Server | Optional Vercel AI Gateway path; no current core-runtime requirement |

## 3. YouTube / Facebook publishing

YouTube:

- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_ID`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

Facebook / Meta:

- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `SOCIAL_PUBLISH_FACEBOOK_ENABLED` (explicit opt-in; currently `false` until the Page access token is renewed)
- `FACEBOOK_GRAPH_API_VERSION` (current default: `v26.0`)

Native social:

- `NATIVE_SOCIAL_SYNC_ENABLED`

The canonical Meta variable name is `FACEBOOK_GRAPH_API_VERSION`. `META_GRAPH_API_VERSION` is retired.

## 4. Video worker contract

Production video rendering and publishing are owned by the GitHub Actions worker. CircleCI remains a manual recovery path.

Worker/runtime configuration includes:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `AUTO_VIDEO_ENABLED`
- `AUTO_VIDEO_BATCH_SIZE`
- `AUTO_VIDEO_SECONDS`
- `DAILY_VIDEO_TARGET`
- `VIDEO_DAILY_LIMIT`
- `VIDEO_AUTOMATION_DRY_RUN`
- `VIDEO_AI_ENABLED`
- `VIDEO_AI_ATTEMPTS_PER_RUN`
- `VIDEO_PROVIDER_ORDER`
- `HF_WAN_VIDEO_ENABLED`
- `HF_LTX_FAST_VIDEO_ENABLED`
- `HF_WAN_SPACE`
- `HF_LTX_FAST_SPACE`
- `HF_TOKEN`
- `HF_VIDEO_PYTHON`
- `VIDEO_TEMPLATE_VERSION`
- `VERIFY_VIDEO_RUNTIME_TOOLS`
- `BACKGROUND_JOB_TARGET`
- `VIDEO_AUTO_PUBLISH`
- `AUTO_VIDEO_PUBLISH_ENABLED`
- `AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL`
- `SOCIAL_PUBLISH_ENABLED`
- `VIDEO_PUBLISH_SCHEDULE`
- `VIDEO_GENERATOR`
- `COMFYUI_ENABLED`
- `COMFYUI_BASE_URL`
- `COMFYUI_TIMEOUT_MS`
- `COMFYUI_MODEL`
- `COMFYUI_WAN_WORKFLOW_JSON`
- `COMFYUI_LTX_WORKFLOW_JSON`
- `FREE_VIDEO_PROVIDER_ENABLED`
- `FREE_VIDEO_PROVIDER_URL`
- `FREE_VIDEO_PROVIDER_TOKEN`
- `VIDEO_MAX_RETRIES`
- `VIDEO_STALE_AFTER_MINUTES`
- `VIDEO_DEFAULT_FORMAT`
- `VIDEO_DEFAULT_DURATION`
- `VIDEO_TIMEZONE`
- `VIDEO_BACKGROUND_BATCH_SIZE`
- `SOCIAL_BACKGROUND_BATCH_SIZE`
- `INTERNAL_JOB_SECRET`

Optional Arabic TTS worker overrides:

- `ARABIC_TTS_VOICE`
- `ARABIC_TTS_RATE`
- `ARABIC_TTS_PITCH`

Internal YouTube sync endpoint:

- `YOUTUBE_SYNC_SECRET`

## 5. Supabase Edge Function contract

### prayer-notification-worker

Required through the Supabase runtime:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `PUSH_CONTACT`

The scheduler secret and VAPID private material are intentionally stored in the private `push_runtime_settings` data path and are not repository variables.

### source-verified-content-agent

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

External source credentials are resolved from the production `content_agent_sources.api_key_secret_name` values.

### spiritual-ai

The current Edge Function does not require a separate external API secret; it is protected by JWT.

### health

No project secret is required.

The repository contains a `sync-youtube-facebook` function source, but it is not part of the active production `supabase/config.toml` function set. Do not re-enable it accidentally.

## 6. CI/CD ownership

### GitHub Actions

Current production roles:

- `quality-gate.yml`: verification only
- `release-vercel.yml`: manual production Vercel release
- `generate-ai-video.yml`: scheduled video generation + social publishing
- `supabase-production-health.yml`: public Supabase health probe

GitHub Actions secrets are referenced by canonical names in workflow files. Secret values are not stored in Git.

### CircleCI

CircleCI is a manual recovery/release path and requires its own protected project/context variables.

Android release additionally requires:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `GH_TOKEN`

## 7. System-managed Vercel variables

These are not application secrets and should not be manually provisioned just to make the application work:

- `VERCEL`
- `VERCEL_ENV`
- `VERCEL_GIT_COMMIT_SHA`
- `VERCEL_GIT_COMMIT_REF`
- `NODE_ENV`

## 8. Retired variables

The deployment validator rejects these in application runtime configuration:

- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Do not provision a direct Postgres application URL. Database schema changes are managed through Supabase migrations and Supabase client/API access.

## 9. Validation

Run:

```bash
pnpm deploy:check
pnpm auth:check
pnpm canonical:check
pnpm native-social:check
pnpm hygiene:check
```

The deployment environment validator checks:

- required variable presence;
- canonical production URL;
- canonical Supabase URL;
- callback URL shape;
- Facebook Graph API version format;
- retired environment names;
- Supabase Auth reachability.

The repository does **not** contain or print production secret values.

## 10. Phase 5 reconciliation result

The current repository contract is internally aligned around:

- Supabase project `kdotmrjfecgafiommzwz`;
- canonical site `https://zikrmediaofficial.vercel.app`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the browser-facing key;
- `SUPABASE_SERVICE_ROLE_KEY` as the server-only key;
- GitHub Actions as the owner of autonomous video scheduling;
- CircleCI as manual recovery/release infrastructure.

A previous production deployment emitted `Missing NEXT_PUBLIC_SUPABASE_ANON_KEY` errors, but those occurrences ended on 2026-09-28 and belong to an older deployment. No `Missing` or `SUPABASE` runtime logs were observed in the latest 24-hour production window during this reconciliation.

Exact secret values were not inspected or modified.

## Security rules

Never commit:

- Supabase service-role keys;
- YouTube client secrets or refresh tokens;
- Facebook page access tokens;
- Gemini keys;
- Hugging Face tokens;
- Android signing material;
- internal job/webhook secrets;
- VAPID private keys.

Only placeholders and variable names belong in repository documentation.
