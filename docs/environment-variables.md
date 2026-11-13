# ZIKR Environment Variables

Last reconciled: **2026-11-11**

This document describes the current environment contract for the web application, GitHub Actions/background workers, CircleCI recovery jobs, and Supabase Edge Functions.

Secret values are never stored in Git. This repository documents variable **names, ownership, scope, and validation rules** only.

## 1. Canonical web/runtime variables

These are the variables required by the Next.js application.

| Variable | Scope | Required | Notes |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | Canonical project: `https://zqtssvlvmkzeeyqghqfk.supabase.co` |
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
| `GOOGLE_CLIENT_ID` | Server | Optional GA4 OAuth client ID; not Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Server | Optional GA4 OAuth client secret |
| `GA4_REFRESH_TOKEN` | Server | GA4 read-only OAuth refresh token |
| `GA4_PROPERTY_ID` | Server | Numeric GA4 property ID |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Public | AdSense publisher identifier |
| `NEXT_PUBLIC_KIDS_ANALYTICS_ENABLED` | Public | Kids game analytics opt-in; default `false`, enable only after consent/CMP review |
| `AI_GATEWAY_API_KEY` | Server | Optional Vercel AI Gateway path; no current core-runtime requirement |

## 3. YouTube / Facebook publishing

YouTube:

- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_ID`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_UPLOAD_PRIVACY` — visibility for automatic video uploads (`public`, `unlisted`, or `private`; defaults to `public`).
- `YOUTUBE_REFRESH_TOKEN` — legacy/ignored by active workers; do not provision it.
 
YouTube remote deletion is not supported by the current integration. The Admin OAuth callback and stored credential reader intentionally reject delete-capable scopes; do not add them to the publishing token or `youtube_oauth_credentials`. A separate owner-approved delete-only credential store and OAuth flow is required before enabling remote YouTube deletion. The legacy `YOUTUBE_REFRESH_TOKEN` environment variable is ignored by the production reader. Never expose refresh tokens to the browser or copy them into Vercel/GitHub Actions environment variables.


The channel connection check prefers OAuth. If the refresh token lacks YouTube channel-read scope, it can still read public channel name/statistics using the server-only `YOUTUBE_API_KEY` and exact `YOUTUBE_CHANNEL_ID`. This public fallback does not grant private YouTube Analytics access; 28-day owner analytics requires reauthorizing OAuth with `youtube.readonly` and `yt-analytics.readonly` scopes, then reconnecting from Admin so the server-only Supabase credential is updated.

Facebook / Meta:

- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `SOCIAL_PUBLISH_FACEBOOK_ENABLED` (runtime gate; Facebook publishing requires a valid OAuth-managed Page connection in Supabase and the Admin setting)
- `FACEBOOK_GRAPH_API_VERSION` (current default: `v26.0`)

Native social:


The canonical Meta variable name is `FACEBOOK_GRAPH_API_VERSION`. `META_GRAPH_API_VERSION` is retired.

## 4. Video worker contract

Production video generation is owned by GitHub Actions `generate-ai-video.yml`. Social publishing is owned by GitHub Actions `publish-social.yml`. CircleCI does not execute either production worker. The protected production social workflow sets `SOCIAL_PUBLISH_ENABLED=true` only for its job, then validates each provider independently against OAuth-managed Supabase credentials and required secrets. If neither provider is ready, it sets `SOCIAL_PUBLISH_ENABLED=false` in the job environment and claims no queue rows. Facebook requires an enabled, connected Page credential, a Page ID, a non-expired credential, and the required Pages publishing/insights scopes. YouTube requires the client ID/secret and a stored OAuth credential with `youtube.upload`, `youtube.readonly`, and `yt-analytics.readonly` scopes, plus a usable refresh token. The repository `.env.example` is deliberately safer for local development and keeps external publishing disabled by default; it is not the production workflow configuration.

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
- `VIDEO_AI_ATTEMPTS_PER_RUN` (fallback only; the Admin `video_automation_ai_attempts_per_run` database setting takes precedence after runtime settings are loaded, bounded from 0 to 4)
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
- `AUTO_VIDEO_PUBLISH_ENABLED`
- `AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL`
- `SOCIAL_PUBLISH_ENABLED`
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
- `SOCIAL_MAX_RETRIES` (optional; capped at 8, default 5)
- `VIDEO_STALE_AFTER_MINUTES`
- `VIDEO_DEFAULT_FORMAT`
- `VIDEO_DEFAULT_DURATION`
- `VIDEO_TIMEZONE`
- `SOCIAL_BACKGROUND_BATCH_SIZE`
- `INTERNAL_JOB_SECRET`

Optional immediate queue-failure alerts:

- `ADMIN_QUEUE_ALERT_WEBHOOK_URL` — server/worker-only destination for JSON alerts.
- `ADMIN_QUEUE_ALERT_WEBHOOK_SECRET` — optional shared secret sent as `X-Zikr-Alert-Secret`.
- `RESEND_API_KEY` — optional Resend API key for email delivery.
- `ADMIN_QUEUE_ALERT_EMAIL_TO` — comma-separated supervisor recipients.
- `ADMIN_QUEUE_ALERT_EMAIL_FROM` — verified sender address.

The worker records an idempotency key in `admin_queue_alert_deliveries`, so the same
failure set is not sent repeatedly. If a configured channel fails, the delivery stays
retryable and the error is retained in Supabase.

Optional Arabic TTS worker overrides:

- `ARABIC_TTS_VOICE`
- `ARABIC_TTS_RATE`
- `ARABIC_TTS_PITCH`

YouTube feed synchronization is read-cache based; the retired internal sync endpoint and its secret are no longer part of the production contract.

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

The legacy `sync-youtube-facebook` Edge Function has been retired from the runtime tree. It is not part of the active production `supabase/config.toml` function set, and social publishing is now owned by GitHub Actions `publish-social.yml` through `social_publish_queue`.

## 6. CI/CD ownership

### GitHub Actions

Current production roles:

- `quality-gate.yml`: PR/main source verification
- `release-finalization.yml`: controlled production deployment through the Vercel CLI
- `release-vercel.yml`: manual post-deploy production smoke verification
- `generate-ai-video.yml`: recurring + manual production video generation
- `publish-social.yml`: recurring + manual YouTube/Facebook publishing through `social_publish_queue`
- `supabase-production-health.yml`: production Supabase health probe
- `urgent-video-dispatcher.yml`: deliberate video dispatch recovery only
- `english-content-sync.yml`: manual bounded synchronization; recurring execution remains in CircleCI
- `global-localization-verify.yml`: retired; its checks remain in the quality gate

GitHub Actions production secrets for video/social are bound through the protected `production` environment. Secret values are not stored in Git.

### CircleCI

CircleCI owns the production web application build artifact, build/release documentation artifact, Android release builds, Supabase release gates, and recurring English content sync. It does not own video generation or social publishing.

Android release additionally requires:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `GH_TOKEN`

## iOS Universal Links

- `IOS_ASSOCIATED_DOMAIN_APP_ID` — server-only App ID in the exact `<APPLE_TEAM_ID>.<BUNDLE_ID>` format used by the iOS Associated Domains entitlement. It populates `/.well-known/apple-app-site-association`; without it the endpoint intentionally returns no app association. This is not a web-runtime requirement, but it is required before iOS Universal Link/OAuth return-to-app acceptance. Configure the real Apple Team ID and bundle identifier in Vercel Production, then redeploy so the statically generated association file is refreshed.
- `ANDROID_APP_LINKS_SHA256` — public SHA-256 signing-certificate fingerprint used by `/.well-known/assetlinks.json`; it must match the certificate used for the distributed Android build.

## 7. System-managed Vercel variables

These are not application secrets and should not be manually provisioned just to make the application work:

- `VERCEL`
- `VERCEL_ENV`
- `VERCEL_GIT_COMMIT_SHA`
- `VERCEL_GIT_COMMIT_REF`
- `NODE_ENV`

## 8. Retired variables

The deployment validator rejects the legacy public Google client ID and warns on direct Postgres connection variables:

- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are not retired: they are server-only OAuth client credentials for optional GA4 reporting, not Google sign-in. GA4 also requires `GA4_REFRESH_TOKEN` and numeric `GA4_PROPERTY_ID`. If any GA4 credential is missing, the reporting panel remains `not_configured`. Google sign-in continues to use Supabase Auth and `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`. For Android native Credential Manager builds, define `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the build environment; it is a public OAuth client ID, not a secret. Store-release readiness checks require it, while ordinary web deployments may continue to use the browser OAuth fallback.

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

## 10. Supabase/Vercel binding status

The linked Vercel project already contains the required Supabase runtime variable names, and its configured URLs point to `https://zqtssvlvmkzeeyqghqfk.supabase.co`. Secret values were not printed or changed.

The current production contract is aligned around:

- Supabase project `zqtssvlvmkzeeyqghqfk`;
- canonical site `https://zikrmediaofficial.vercel.app`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` as the browser-facing key;
- `SUPABASE_SERVICE_ROLE_KEY` as the server-only key;
- GitHub Actions as the sole owner of video generation and social publishing;
- CircleCI as the application build/documentation, Android release, Supabase gate, and English-sync lane.

A read-only check against that target passed for Auth settings, `quran_surahs`, `kids_games`, and `kids_content`. It found two schema gaps: `content_library.summary_en` is missing, and `public.content_translation_queue` is absent. Treat schema reconciliation as incomplete until these are reviewed and migrated.

Google sign-in is handled by Supabase Auth and the public client uses `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`. The server-only `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are used by the optional GA4 reporting integration, which also requires `GA4_REFRESH_TOKEN` and `GA4_PROPERTY_ID`; never expose these credentials through a `NEXT_PUBLIC_*` variable.

As of October 9, 2026, a fresh production schema query confirmed that `public.content_library.summary_en` and `public.content_translation_queue` both exist. The earlier schema-gap note has been reconciled; it is no longer a current production gap. The current Supabase Security Advisor still warns that leaked-password protection is disabled, and the Performance Advisor reports 68 unused indexes (informational; review query workload before removal).

The active Supabase health workflow is pinned to the canonical production target. Historical documentation may still mention retired project refs, but active runtime and workflow configuration must remain on `zqtssvlvmkzeeyqghqfk`. Any future database-target change must use a reviewed forward migration or configuration change rather than rewriting applied migration history.

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

## 11. Vercel environment audit — 2026-11-01

Read-only verification of the connected production Vercel project confirmed these exact runtime values:

- `NEXT_PUBLIC_SUPABASE_URL=https://zqtssvlvmkzeeyqghqfk.supabase.co`
- `NEXT_PUBLIC_SITE_URL=https://zikrmediaofficial.vercel.app`
- `AUTH_CALLBACK_URL=https://zikrmediaofficial.vercel.app/auth/callback`

The following variables were found in Vercel and are cleanup candidates after confirming ownership:

- Android signing material: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. These belong in the protected CircleCI `android-signing` context only.
- Obsolete Google OAuth application variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Google web/native login uses Supabase Auth and `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- Retired/stale application variables: `VIDEO_AUTO_PUBLISH`, `SOCIAL_SYNC_SECRET`.
- `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_HOST`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD` are integration-managed database connection variables. They are not used by the Next.js runtime; **review their Vercel/Supabase integration ownership before removal** and do not delete them blindly.

Do not remove `ANDROID_APP_LINKS_SHA256`; it is read by the Android asset-links route. Do not remove `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, or `FACEBOOK_PAGE_ID`; the server-side Facebook OAuth connect/callback uses them. `FACEBOOK_PAGE_ACCESS_TOKEN` is read only by the explicit Admin server-token adoption flow, which validates and imports it into `social_platform_credentials`; outbound publishers read the managed database credential, not the Vercel environment token. Keep it only while that adoption flow is in use. The GitHub dispatch/release tokens remain required by the admin release manager.

The connected Vercel actions available to this repair session can list, read, create, and edit project environment variables, but do not expose a delete operation. Therefore the obsolete variables above have been identified but not removed in this pass. Remove them from Vercel Project Settings → Environment Variables, preserving the separate CircleCI context and GitHub repository/environment secrets. Never copy secret values into Git or this document.

## Quran video recitation alignment

These optional settings must refer to the same human reciter:

- `QURAN_VIDEO_RECITER_CODE`: code in `public.quran_reciters` used to verify the canonical full-surah audio catalogue.
- `QURAN_AYAH_AUDIO_RECITER_CODE`: reciter actually served by the per-ayah audio endpoint.
- `QURAN_AYAH_AUDIO_BASE_URL`: per-ayah MP3 base URL for that reciter; default is the Alafasy endpoint.

The code defaults both reciter identifiers to `alafasy` and rejects a mismatch before a Quran video source can be accepted. Do not change only one variable. The `quran_audio` table currently stores full-surah records, so the per-ayah endpoint is a separate provider and must be verified as the same reciter.
