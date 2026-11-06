# ZIKR — Video Generation & Social Publishing Runbook

## Current ownership

| Responsibility | Owner | Workflow |
|---|---|---|
| Video generation | GitHub Actions | `.github/workflows/generate-ai-video.yml` |
| Social publishing | GitHub Actions | `.github/workflows/publish-social.yml` |
| Application build/documentation | CircleCI | `application-build-docs` |
| Android build/signing | CircleCI | `android-rebuild` |
| Prayer notifications | Supabase | `prayer-notification-worker` + pg_cron |
| Source-verified content ingestion | Supabase | `source-verified-content-agent` + pg_cron |

There is no CircleCI production video/social worker and no Vercel Cron for video or social publishing.

## Video pipeline

Production video generation runs four times daily:

- 03:17 UTC
- 09:17 UTC
- 15:17 UTC
- 21:17 UTC

The same workflow also exposes a deliberate manual dispatch for recovery or an admin Run Now request.

The worker executes:

`pnpm background:jobs`

The canonical rendering path is the deterministic FFmpeg template renderer. Source religious text is treated as authoritative; AI may be used only for optional supporting layers such as reflections/captions.

Queue safety is enforced through:

- idempotent automation keys;
- conditional queue claims;
- stale-processing recovery;
- bounded retry attempts;
- separate generation and publication responsibilities.

Video generation may enqueue a row in `social_publish_queue`, but it must not publish directly.

## Internal ZIKR video publication

Completed MP4s are uploaded to Cloudinary and registered in the ZIKR `videos` table with the `zikr_internal_video_factory` metadata marker. Each record is initially unpublished. The site-owned `content_publish_queue` then publishes the video to the ZIKR website after verifying that its media URL is HTTPS on `res.cloudinary.com` and that the record has not been purged. The public `/videos` page displays only internally generated ZIKR videos; individual video pages play the verified Cloudinary MP4.

This queue is not a social queue. No video-generation step may enqueue `social_publish_queue`, call a provider upload endpoint, or require a social publishing permission. Template previews are explicitly excluded from public publication.

## External social publishing — retired

External social publishing and external written-post distribution are disabled. The legacy social workflow is guarded by `if: false`; old Facebook and social control APIs return HTTP 410. Legacy YouTube/Facebook media-import endpoints and external video retry actions are also retired. The YouTube OAuth connection remains available only for read-only channel and analytics reporting using `youtube.readonly` and `yt-analytics.readonly`; upload and delete scopes are neither requested nor accepted.

Do not restore the old social publishing workflow or its provider credentials as part of video generation. Historical social queue and insight records remain retained for audit and are not processed.

## Monetag SmartLink

Eligible non-kids social videos append the disclosed Monetag SmartLink to YouTube descriptions and Facebook/Reels captions at publish time. YouTube's tags field receives descriptive keywords; the actual URL remains in the description because tags are not clickable links.

The link is excluded from child-directed videos and is omitted from Facebook video captions when the source audience cannot be verified. The website placement is limited to the homepage, public video hub, and eligible general-public footer routes; it is not shown in children's or sacred-text/worship-tool interfaces.

This integration does not turn on social publishing. The established `SOCIAL_PUBLISH_ENABLED` and provider readiness gates remain authoritative. Already-published posts are not edited or republished.

See `docs/MONETAG_SMARTLINK_PLACEMENT.md` for placement and verification details.

## Admin Run Now

Admin Run Now does not run a separate poller or second scheduler.

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


## Written Facebook posts

The written-post factory runs through .github/workflows/generate-written-content.yml, independently from video production. It selects published/reviewed content records, preserves Quran/Hadith/Dua/Adhkar quotations verbatim, and queues the post as content_type=written_post with video_url=null and Facebook as the target. It reuses the existing social_publish_queue and publish-social.yml publisher; there is no second publishing worker. The workflow requires GEMINI_API_KEY as a GitHub Actions secret in the production environment. Vercel environment variables are not automatically available to GitHub Actions.

## Generated media lifecycle

Generated video binaries are temporary publishing assets. The publisher removes eligible source media only after every requested platform has a confirmed remote ID. On partial publication it retains the source for unfinished targets and retries only targets without a confirmed remote ID. Queue records, remote IDs, source references, and audit metadata remain available after media cleanup.

## Optional additional Hugging Face Spaces

The video worker accepts up to five additional public Spaces through the GitHub Actions variable HF_VIDEO_CUSTOM_SPACES, using a JSON array such as:
[{"space":"owner/space-one","variant":"wan2_2_fast","enabled":true},{"space":"owner/space-two","variant":"ltx_fast","enabled":true}]

Each Space must expose a Gradio API compatible with the existing Wan 2.2 or LTX Fast adapter. Any other input/output signature needs a dedicated adapter before use. Free quotas, queue availability, runtime availability, and commercial terms are controlled by the Space owner and Hugging Face; VIDEO_FREE_ONLY=true does not guarantee unlimited free GPU time.
