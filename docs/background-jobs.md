# Background jobs runbook

ZIKR's recurring production video and social queues are executed by the scheduled CircleCI `background-jobs` workflow. GitHub Actions `generate-ai-video.yml` remains the canonical manual dispatch path.

## Production video generation

The autonomous CircleCI worker runs four times per day at 03:17, 09:17, 15:17, and 21:17 UTC. GitHub Actions retains manual dispatch for deliberate diagnostics or queue recovery without a recurring Actions schedule. Its existing daily pacing target remains eight source-locked requests; the four scheduled runs reduce idle runner starts without exceeding that pacing target. Commits and merges no longer start a production video run automatically.

The worker invokes `pnpm background:jobs` with the deterministic FFmpeg template renderer. Production generation uses trusted Quran/Hadith/Dua content, FFmpeg, Arabic fonts, optional HTTPS recitation audio, and Supabase Storage. Gemini remains optional for the short reflection/caption layer and must not replace or rewrite source religious text.

The queue is idempotent through `video_generation_requests.automation_key` and conditional pending claims, so scheduled reruns do not create duplicate automated jobs.

## Automatic social publishing

The scheduled worker runs with `SOCIAL_PUBLISH_ENABLED=true`. YouTube publishing can remain active independently; Facebook requires the explicit `SOCIAL_PUBLISH_FACEBOOK_ENABLED=true` gate and valid Meta credentials. Successfully rendered videos are queued and processed automatically for enabled providers, as before.

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
Video/social worker: 4 runs/day; retains the existing daily target of 8 requests
Admin Run Now: direct GitHub workflow dispatch from the admin action
English content sync: daily, at most 5 article translations and 25 Hadith records by default
Video length: 16 seconds by default; deterministic FFmpeg renderer
```

The daily English content sync uses one shared runner for one article batch and one Hadith batch. Article work is capped at five by default and uses one configured Gemini key/model request per article; it does not retry the same batch ten times or rotate through API keys/models. Hadith work is capped at 25 records by default. Manual dispatch remains available, with script-level upper bounds.

## Recovery

CircleCI owns the normal recurring video/social and English-content schedules, plus Android release builds and deliberate recovery. It is not part of the automatic source-verification loop.

The prayer notification path remains separate: Supabase `pg_cron` invokes `prayer-notification-worker` every minute.

The legacy Supabase `zikr-video-processing` job and the Vercel `/api/internal/video-processing` compatibility endpoint are not production schedulers.

## Safety

Queue claiming is conditional on `status=pending`, and automation keys prevent duplicate generated videos and duplicate social queue records. Provider secrets remain server-side. Translation and Hadith sync failures now return a failing process status so Actions cannot mark a partially failed batch green.

A generated video is only considered published when the provider returns its publication identifier and the queue records the provider result.

**Last updated:** October 8, 2026
