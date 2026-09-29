# Background jobs runbook

ZIKR's production video and social queues are executed automatically by the repository's GitHub Actions worker `.github/workflows/generate-ai-video.yml`.

## Production video generation

The autonomous worker runs every two hours and also supports manual dispatch for diagnostics. It invokes `pnpm background:jobs` with the free deterministic `template` renderer.

Production generation uses trusted Quran/Hadith/Dua content, FFmpeg, Arabic fonts, optional HTTPS recitation audio, and Supabase Storage. Gemini is optional and is limited to a short reflection/caption layer; it does not replace or rewrite source religious text.

The queue is idempotent through `video_generation_requests.automation_key` and conditional pending claims, so scheduled reruns do not create duplicate automated jobs.

## Automatic social publishing

The scheduled worker runs with `SOCIAL_PUBLISH_ENABLED=true`. Every successfully rendered video is placed into `social_publish_queue` and then processed automatically for configured providers.

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

## Current schedule

```text
Every 2 hours
2 new source-locked video requests per run
16-second free FFmpeg videos
Automatic social queue processing
```

The workflow also supports manual `workflow_dispatch` for controlled diagnostics; normal operation does not require manual intervention.

## Recovery

CircleCI remains available for CI verification, Android builds, and deliberate background recovery. It is not part of the normal video publishing schedule.

The prayer notification path remains separate: Supabase `pg_cron` invokes `prayer-notification-worker` every minute.

The legacy Supabase `zikr-video-processing` job and the Vercel `/api/internal/video-processing` compatibility endpoint are not production schedulers.

## Safety

Queue claiming is conditional on `status=pending`, and automation keys prevent duplicate generated videos and duplicate social queue records. Provider secrets remain server-side.

A generated video is only considered published when the provider returns its publication identifier and the queue records the provider result.

**Last updated:** September 29, 2026
