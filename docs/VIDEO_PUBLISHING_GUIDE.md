# ZIKR — Video Generation & Social Publishing Runbook

## Current ownership

| Responsibility | Owner | Workflow |
|---|---|---|
| Video generation | GitHub Actions | `.github/workflows/generate-ai-video.yml` |
| Internal website video publication | GitHub Actions + Supabase | `content_publish_queue` |
| External social publishing | Source-verified text posts; automated-QA-gated videos | `.github/workflows/publish-social.yml` after generation, every 15 minutes, or manual dispatch |
| Application build/documentation | CircleCI | `application-build-docs` |
| Android build/signing | CircleCI | `android-rebuild` |
| Prayer notifications | Supabase | `prayer-notification-worker` + pg_cron |
| Source-verified content ingestion | Supabase | `source-verified-content-agent` + pg_cron |

There is no CircleCI production video worker and no Vercel Cron for video publication. External social publishing is separate from rendering and requires provider preflight and administrator enablement. Video rows additionally require five passing automated QA checks; source-verified written text rows use the written-content quality gate.

## Video pipeline

Production video generation runs four times daily:

- 03:17 UTC
- 09:17 UTC
- 15:17 UTC
- 21:17 UTC

The same workflow also exposes a deliberate manual dispatch for recovery or an admin Run Now request.

The worker executes:

`pnpm background:jobs`

The canonical rendering path is the deterministic FFmpeg template renderer. Source religious text is treated as authoritative; AI may be used only for optional supporting layers such as reflections/captions. The worker reads the Admin `video_automation_ai_attempts_per_run` setting at runtime (0–4 attempts per worker cycle); the production default is four free Hugging Face provider attempts, followed by deterministic FFmpeg fallback. The production duration default is 25 seconds, with the Admin override bounded from 10 to 45 seconds. No paid provider is silently enabled.

Queue safety is enforced through:

- idempotent automation keys;
- conditional queue claims;
- stale-processing recovery;
- bounded retry attempts;
- separate generation and publication responsibilities.

Video generation may enqueue a new row in `social_publish_queue`, but it must not publish directly. The social worker is triggered immediately after a successful video workflow, by an explicit manual dispatch, and by a bounded 15-minute schedule (UTC minutes 07, 22, 37, 52) that drains up to five eligible rows and retries deferred/partial provider results after cooldowns.

## Internal ZIKR video publication

Completed MP4s are uploaded to Cloudinary and registered in the ZIKR `videos` table with the `zikr_internal_video_factory` metadata marker. Each record is initially unpublished. The site-owned `content_publish_queue` then publishes the video to the ZIKR website after verifying that its media URL is HTTPS on `res.cloudinary.com` and that the record has not been purged. General-audience internal videos appear in `/videos`; child-directed videos with `metadata.audience=kids` are assigned to the dedicated `kids-stories` category and the separate `/kids/videos` library. Kids media is excluded from the general feed, while the Kids library enforces an explicit audience and generator filter.

This queue is not a social queue. No video-generation step may enqueue `social_publish_queue`, call a provider upload endpoint, or require a social publishing permission. Template previews are explicitly excluded from public publication.

## Automated-QA external social publishing

Social delivery is a separate worker, never part of the renderer. After a successful video-generation run, GitHub Actions invokes `.github/workflows/publish-social.yml`; an administrator can also dispatch it manually. A bounded 15-minute schedule also drains up to five eligible rows and retries deferred/partial results after provider cooldowns. The workflow validates the connected Facebook Page and a YouTube OAuth refresh credential with `youtube.upload`, `youtube.readonly`, and `yt-analytics.readonly` before enabling each provider. No delete scope is requested. If provider readiness fails, that provider remains disabled and no rows are claimed for it.

Only newly created rows at or after `SOCIAL_PUBLISH_AFTER` are eligible. The historic queue is excluded from automatic replay. Each video must pass automated source, audio, visuals, captions, and rights checks recorded on its generation request and bound to the exact source/content/template/MP4 fingerprint. The worker rechecks this immutable automated QA record immediately before every provider call; missing, stale, changed, or failed checks block publication. No human review is required. Provider results and remote IDs are stored per platform to prevent duplicate publishing. Social insights are refreshed by the dedicated daily `sync-social-insights.yml` workflow and after relevant changes reach `main`; that analytics-only worker disables social publishing explicitly and does not claim queue rows.

The internal website video catalog and `content_publish_queue` remain independent from external social delivery. A video may appear on the ZIKR website without being posted publicly to a social platform.

## Monetag SmartLink

Monetag SmartLink placement is limited to approved general-audience website placements: the homepage, public video hub, and eligible general-public footer routes. It is not shown in children's sections or sacred-text/worship-tool interfaces.

Monetag links are not appended to YouTube or Facebook descriptions/captions; provider captions use the approved social metadata contract. See `docs/MONETAG_SMARTLINK_PLACEMENT.md` for website placement and verification details.

## Admin Run Now

Admin Run Now does not run a second scheduler; the shared social queue has one bounded 15-minute retry schedule plus the immediate post-generation trigger.

The admin action dispatches the canonical GitHub video workflow directly. The workflow concurrency group prevents overlapping production generations.

## Recovery

Use GitHub Actions workflow dispatch for deliberate video or social recovery.

Do not add:

- Vercel Cron;
- Supabase pg_cron for video/social;
- CircleCI `scripts/run-background-jobs.ts`;
- a second social publisher.

## Relevant verification

```bash
pnpm scheduler:check
pnpm video:contract:check
pnpm voice:factory:check
pnpm video:factory:check
pnpm video:qa:check
pnpm social:publish:check
pnpm video:engine:check
```

For the complete ownership matrix, see `docs/AUTOMATION_OWNERSHIP_2026-10-08.md`.
For queue internals, see `docs/background-jobs.md`.


## Written Facebook posts and internal website content

The written-content factory runs through `.github/workflows/generate-written-content.yml`, independently from video rendering. It selects published/reviewed source records, preserves Quran/Hadith/Dua/Adhkar quotations verbatim, and creates unpublished ZIKR website articles. Website scheduling remains in `content_publish_queue` with `content_table=articles`.

For each generated draft, the same job also creates one idempotent `social_publish_queue` record with `content_type=written_post`, `target_platforms=[facebook]`, and no video asset. The existing social worker publishes it as a Facebook Page feed text post through the existing Page `/feed` adapter; video QA remains mandatory for video records only. The dedicated Admin route is `/admin/social/written-studio`. The social publisher workflow starts after either successful video generation or successful written-content generation, and its bounded schedule remains the retry fallback. The workflow requires `GEMINI_API_KEY` as a GitHub Actions secret in the production environment. Vercel environment variables are not automatically available to GitHub Actions.

## Generated media lifecycle

The Cloudinary video URL stored in `public.videos` is the permanent playback master for the ZIKR website and must never be deleted by social publishing or storage retention. Social delivery does not delete media masters. If a separate Supabase staging copy exists, only that redundant copy may be removed after the 48-hour grace period, confirmed remote IDs for all requested platforms, and a reference check. Partial publication retains staging media for unfinished targets and retries only targets without a confirmed remote ID. Queue records, remote IDs, source references, and audit metadata remain available.

## Optional additional Hugging Face Spaces

The video worker accepts up to five additional public Spaces through the GitHub Actions variable HF_VIDEO_CUSTOM_SPACES, using a JSON array such as:
[{"space":"owner/space-one","variant":"wan2_2_fast","enabled":true},{"space":"owner/space-two","variant":"ltx_fast","enabled":true}]

Each Space must expose a Gradio API compatible with the existing Wan 2.2 or LTX Fast adapter. Any other input/output signature needs a dedicated adapter before use. Free quotas, queue availability, runtime availability, and commercial terms are controlled by the Space owner and Hugging Face; VIDEO_FREE_ONLY=true does not guarantee unlimited free GPU time.


## Social channel connection and environment placement — 2026-11-06

The public social/video hub is `/videos`. It reads the official YouTube feed and the non-secret Facebook Page profile from the server-side social profile cache. Visitors can play YouTube embeds, open YouTube to subscribe or like with their own Google account, open/follow the Facebook Page with their own Facebook account, and like internally published ZIKR videos after signing in to ZIKR.

### Vercel Production environment

Keep these values in Vercel Project → Settings → Environment Variables (Production), not in client-visible variables:

- Core: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Facebook OAuth: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_GRAPH_API_VERSION=v26.0`. Set `FACEBOOK_PAGE_ID` when the connected Meta account manages more than one Page; it selects the intended Page.
- YouTube: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`.
- Public app URLs: `NEXT_PUBLIC_SITE_URL=https://zikrmediaofficial.vercel.app`, `AUTH_CALLBACK_URL=https://zikrmediaofficial.vercel.app/auth/callback`, and the canonical `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Never prefix an app secret, service-role key, OAuth refresh token, or Page access token with `NEXT_PUBLIC_`.

### GitHub Actions → production environment

The video and social workers run in GitHub Actions, so Vercel secrets are not inherited by them. Add these as GitHub repository/environment **Secrets** under the `production` environment:

- `SUPABASE_SERVICE_ROLE_KEY` (the workflow also accepts the legacy `SUPABASE_SERVICE_KEY` name)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`
- Optional: `HF_TOKEN` (public Hugging Face Spaces may still impose their own free quotas)
- Optional alerting: `ADMIN_QUEUE_ALERT_WEBHOOK_URL`, `ADMIN_QUEUE_ALERT_WEBHOOK_SECRET` (or `WEBHOOK_SECRET`), `RESEND_API_KEY`.

Add these as GitHub Actions **Variables** in the same `production` environment when you need to override the defaults:

- `FACEBOOK_PUBLISHING_ENABLED=true`
- `YOUTUBE_PUBLISHING_ENABLED=true`
- `FACEBOOK_GRAPH_API_VERSION=v26.0`
- Optional `HF_VIDEO_CUSTOM_SPACES` JSON array.

The workflows already supply the canonical Supabase URL and social publishing enable flag; do not create duplicate Vercel Cron or Supabase cron workers for video/social publishing.

### Supabase — what to enter

Do **not** paste Meta App Secret, Google OAuth Client Secret, YouTube refresh tokens, Facebook Page tokens, Cloudinary secrets, or GitHub worker secrets into Supabase Project → Edge Function Secrets. The app stores provider credentials after the administrator completes OAuth:

- Facebook Page credentials: `social_platform_credentials` (RLS-protected).
- YouTube OAuth refresh credential and granted scopes: `youtube_oauth_credentials` (RLS-protected).
- Public, non-secret Page/channel profile metadata: `social_platform_profiles`.

The Facebook callback must be registered in Meta Developers as:

`https://zikrmediaofficial.vercel.app/api/admin/social/facebook/callback`

After deploying, sign in with a ZIKR administrator, open `/admin/social`, and connect the intended Facebook Page and YouTube channel once. Grant the requested publishing/read scopes. If the Meta account manages multiple Pages, set `FACEBOOK_PAGE_ID` in Vercel before connecting so the callback cannot select the wrong Page. Do not manually copy access tokens into the database.

### Current automation and approval boundary

Production video generation is configured for a daily target of 20, in four UTC runs (03:17, 09:17, 15:17, 21:17), with a hard daily ceiling of 24. Provider quotas, storage availability, and source validation can reduce the actual number completed. Social publishing runs immediately after a successful video worker and is retried every 15 minutes (UTC minutes 07, 22, 37, 52), five eligible rows per run, with each connected platform checked independently.

External video publishing now uses a verified automated QA policy for the five checks (source, audio, visuals, captions, rights). The worker creates a system QA record only when every check passes and binds it to the exact source, content, template version, and MP4 URL; it revalidates that fingerprint immediately before each upload. Failed or uncertain checks are not auto-approved and are retained in the generation audit without public distribution. Manual review is not required for passing videos.

The live Supabase project has the private `video_likes` table and the RLS-protected `video_like_counts` summary table. Only authenticated users can add/remove their own likes; the public site reads aggregate counts, not other users' identities.


### OAuth callback and Facebook Page scopes

The production Google OAuth web client currently backs both the ZIKR Google sign-in configuration and the YouTube publishing connection. Its **Authorized redirect URIs** must contain both exact values:

- YouTube publishing callback: `https://zikrmediaofficial.vercel.app/api/admin/social/youtube/callback`
- Supabase Google provider callback: `https://zqtssvlvmkzeeyqghqfk.supabase.co/auth/v1/callback`

Do not substitute the application's post-login `/auth/callback` route for the Supabase provider callback. Google validates the redirect URI against the specific OAuth client ID used in the request; protocol, hostname, path, and trailing slash must match exactly. The YouTube worker uses the same `YOUTUBE_CLIENT_ID` during authorization and token exchange.

Facebook Page publishing requests the least-privilege permissions required by the implemented workflow: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, and `read_insights`. The Page comment-moderation permission `pages_manage_engagement` is intentionally not requested or required for video posting. Add it only if a future, explicitly implemented comment-management feature needs it and Meta has enabled the permission for this app.
