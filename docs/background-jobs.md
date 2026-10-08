# Background jobs runbook

ZIKR's recurring production video queue is executed by GitHub Actions `generate-ai-video.yml`, and the social publishing queue is executed by GitHub Actions `publish-social.yml`. `scripts/run-background-jobs.ts` remains the shared worker entrypoint; CircleCI no longer executes it for production video/social work.

## Production video generation

GitHub Actions runs video generation four times per day at 03:17, 09:17, 15:17, and 21:17 UTC, with a manual dispatch path for Run Now/recovery. Social publishing runs every 15 minutes in its own workflow. Commits and merges do not start production video generation.

GitHub Actions invokes `pnpm background:jobs` with the deterministic FFmpeg template renderer. Production generation uses trusted Quran/Hadith/Dua content, FFmpeg, Arabic fonts, optional HTTPS recitation audio, and Supabase Storage. Gemini remains optional for the short reflection/caption layer and must not replace or rewrite source religious text.

The queue is idempotent through `video_generation_requests.automation_key` and conditional pending claims, so scheduled reruns do not create duplicate automated jobs.

## Automatic social publishing

The dedicated GitHub Actions publisher runs every 15 minutes with `SOCIAL_PUBLISH_ENABLED=true`. YouTube publishing can remain active independently; Facebook requires the explicit `SOCIAL_PUBLISH_FACEBOOK_ENABLED=true` gate and valid Meta credentials. It consumes `social_publish_queue` entries produced by the video worker and does not render videos itself.

YouTube requires:

```text
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_REFRESH_TOKEN
YOUTUBE_CHANNEL_ID
```

Facebook requires:

```text
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
```

Secrets are GitHub Actions secrets and are never committed to the repository.

If a provider credential is missing or expired, that platform is recorded as failed instead of pretending that publication succeeded. Video generation itself remains independent from a single provider failure.

## Current schedules and bounded work

```text
Video generation: 4 runs/day
Social publishing: every 15 minutes
Admin Run Now: direct GitHub workflow dispatch from the admin action
English content sync: daily, at most 5 article translations and 25 Hadith records by default
Video length: 16 seconds by default; deterministic FFmpeg renderer
```

The daily English content sync uses one shared runner for one article batch and one Hadith batch. Article work is capped at five by default and uses one configured Gemini key/model request per article; it does not retry the same batch ten times or rotate through API keys/models. Hadith work is capped at 25 records by default. Manual dispatch remains available, with script-level upper bounds.

## Recovery

Use GitHub Actions workflow dispatch for deliberate video generation or social publishing recovery. CircleCI is reserved for application/Android builds, documentation/release artifacts, English-content sync, Supabase gates, and explicit release operations.

The prayer notification path remains separate: Supabase `pg_cron` invokes `prayer-notification-worker` every minute.

The legacy Supabase `zikr-video-processing` job and the Vercel `/api/internal/video-processing` compatibility endpoint are not production schedulers.

## Safety

Queue claiming is conditional on `status=pending`, and automation keys prevent duplicate generated videos and duplicate social queue records. Provider secrets remain server-side. Translation and Hadith sync failures now return a failing process status so Actions cannot mark a partially failed batch green.

A generated video is only considered published when the provider returns its publication identifier and the queue records the provider result.

**Last updated:** October 8, 2026
