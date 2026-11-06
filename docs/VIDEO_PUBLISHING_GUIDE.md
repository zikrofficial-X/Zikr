# ZIKR — Video Generation & Social Publishing Runbook

## Current ownership

| Responsibility | Owner | Workflow |
|---|---|---|
| Video generation | GitHub Actions | `.github/workflows/generate-ai-video.yml` |
| Internal website video publication | GitHub Actions + Supabase | `content_publish_queue` |
| External social publishing | Approval-gated | `.github/workflows/publish-social.yml` after video generation or manual dispatch |
| Application build/documentation | CircleCI | `application-build-docs` |
| Android build/signing | CircleCI | `android-rebuild` |
| Prayer notifications | Supabase | `prayer-notification-worker` + pg_cron |
| Source-verified content ingestion | Supabase | `source-verified-content-agent` + pg_cron |

There is no CircleCI production video worker and no Vercel Cron for video publication. External social publishing is separate from rendering and requires provider preflight, administrator enablement, and human QA approval.

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

Video generation may enqueue a new row in `social_publish_queue`, but it must not publish directly. The social worker is triggered after a successful video workflow or by an explicit manual dispatch; it does not poll every 15 minutes.

## Internal ZIKR video publication

Completed MP4s are uploaded to Cloudinary and registered in the ZIKR `videos` table with the `zikr_internal_video_factory` metadata marker. Each record is initially unpublished. The site-owned `content_publish_queue` then publishes the video to the ZIKR website after verifying that its media URL is HTTPS on `res.cloudinary.com` and that the record has not been purged. The public `/videos` page displays only internally generated ZIKR videos; individual video pages play the verified Cloudinary MP4.

This queue is not a social queue. No video-generation step may enqueue `social_publish_queue`, call a provider upload endpoint, or require a social publishing permission. Template previews are explicitly excluded from public publication.

## Approval-gated external social publishing

Social delivery is a separate worker, never part of the renderer. After a successful video-generation run, GitHub Actions may invoke `.github/workflows/publish-social.yml`; an administrator can also dispatch it manually. There is no periodic polling. The workflow validates the connected Facebook Page and a YouTube OAuth refresh credential with `youtube.upload`, `youtube.readonly`, and `yt-analytics.readonly` before enabling each provider. No delete scope is requested. If provider readiness fails, that provider remains disabled and no rows are claimed for it.

Only newly created rows at or after `SOCIAL_PUBLISH_AFTER` are eligible. The historic queue is excluded from automatic replay. Each video must pass the human QA review recorded on its generation request. The worker rechecks approval immediately before every provider call; a failed lookup holds the video. Provider results and remote IDs are stored per platform to prevent duplicate publishing. Social insights synchronization is opt-in and disabled during publishing runs to reduce Supabase reads.

The internal website video catalog and `content_publish_queue` remain independent from external social delivery. A video may appear on the ZIKR website without being posted publicly to a social platform.

## Monetag SmartLink

Monetag SmartLink placement is limited to approved general-audience website placements: the homepage, public video hub, and eligible general-public footer routes. It is not shown in children's sections or sacred-text/worship-tool interfaces.

Monetag links are not appended to YouTube or Facebook descriptions/captions; provider captions use the approved social metadata contract. See `docs/MONETAG_SMARTLINK_PLACEMENT.md` for website placement and verification details.

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


## Internal written website content

The written-content factory runs through `.github/workflows/generate-written-content.yml`, independently from video production. It selects published/reviewed source records, preserves Quran/Hadith/Dua/Adhkar quotations verbatim, and creates unpublished ZIKR website articles. It schedules those articles through `content_publish_queue` with `content_table=articles`; it does not create social posts or use `social_publish_queue`. The workflow requires `GEMINI_API_KEY` as a GitHub Actions secret in the production environment. Vercel environment variables are not automatically available to GitHub Actions.

## Generated media lifecycle

Generated video binaries are temporary publishing assets. The publisher removes eligible source media only after every requested platform has a confirmed remote ID. On partial publication it retains the source for unfinished targets and retries only targets without a confirmed remote ID. Queue records, remote IDs, source references, and audit metadata remain available after media cleanup.

## Optional additional Hugging Face Spaces

The video worker accepts up to five additional public Spaces through the GitHub Actions variable HF_VIDEO_CUSTOM_SPACES, using a JSON array such as:
[{"space":"owner/space-one","variant":"wan2_2_fast","enabled":true},{"space":"owner/space-two","variant":"ltx_fast","enabled":true}]

Each Space must expose a Gradio API compatible with the existing Wan 2.2 or LTX Fast adapter. Any other input/output signature needs a dedicated adapter before use. Free quotas, queue availability, runtime availability, and commercial terms are controlled by the Space owner and Hugging Face; VIDEO_FREE_ONLY=true does not guarantee unlimited free GPU time.
