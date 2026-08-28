# ZIKR autonomous media automation runbook

## What is implemented

The production-safe default generator is `VIDEO_GENERATOR=template`. It selects a Quran ayah already stored in `quran_ayahs`, creates a deterministic 9:16 MP4 using ffmpeg and Arabic subtitles, uploads it to the public `videos` Supabase Storage bucket, marks the durable request completed, and queues social publishing only when the corresponding server-side credentials are configured.

The generator does not invent Quran text, tafsir, hadith, religious rulings, or narration. Every automated Quran video stores `sourceUrl`, `sourceLabel`, `surahId`, and `ayahNumber` in the request JSON. The source URL is a direct Quran.com ayah URL.

The queue is idempotent. `video_generation_requests.automation_key` and `social_publish_queue.automation_key` have partial unique indexes, so rerunning a schedule does not create duplicate generated videos or duplicate social queue entries.

HeyGen remains an optional legacy path. It is not the default because the production inventory showed HTTP 402 insufficient credits. Set `VIDEO_GENERATOR=heygen` only when a funded HeyGen account and approved narration workflow are intentionally configured.

## Required CircleCI project environment variables

Set these as protected project variables or a restricted context. Values must never be committed:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side database and Storage writes only |
| `SUPABASE_ANON_KEY` | Required by the existing server environment normalizer |
| `NEXT_PUBLIC_SITE_URL` | Canonical public ZIKR URL |
| `YOUTUBE_CLIENT_ID` | Optional YouTube OAuth client ID |
| `YOUTUBE_CLIENT_SECRET` | Optional YouTube OAuth client secret |
| `YOUTUBE_REFRESH_TOKEN` | Optional server-side YouTube refresh token |
| `YOUTUBE_CHANNEL_ID` | Optional YouTube target channel |
| `FACEBOOK_PAGE_ID` | Optional Facebook Page ID |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Optional server-side Page access token |

The first four variables are required for the site-only generation path. YouTube and Facebook credentials are optional; without them, videos remain on ZIKR and are not falsely marked as published.

## CircleCI schedule trigger

The repository contains a `run_automation` boolean pipeline parameter and a `scheduled-automation` workflow. In CircleCI, open the project settings, create a schedule trigger on `main`, choose the system scheduler as the actor, and set `run_automation=true`. A practical starting schedule is every six hours, with a batch size of one. This produces four Quran videos per UTC day and leaves free-plan headroom for verification builds.

CircleCI schedule triggers are configured in the authenticated CircleCI web app. The current browser session is not authenticated there, so the schedule cannot be created through this repository change alone.

## Publishing behavior

YouTube uses the existing OAuth upload implementation. YouTube's official documentation requires `youtube.upload`-compatible OAuth and notes a 100-unit quota impact per upload call. New or unverified API projects may be restricted to private visibility until audit approval, so the worker must not claim public reach until the channel configuration is verified.

Facebook Reels use Meta's Page Reels flow. Meta documents a three-step upload/publish sequence and a limit of 30 API-published Reels within a moving 24-hour period. The worker queues no more than one Reel per generated item and does not attempt to bypass that limit. Facebook Page text posts use the Pages API and require the relevant Page permissions.

## Failure handling

A failed render is recorded in `video_generation_requests.error_message` and `error_details`. A failed social target is recorded in `social_publish_queue.error_message` with per-platform results. The queue is not silently marked published. Re-running the scheduler is safe because claims are conditional on the queued status and idempotency keys prevent duplicate inserts.

## Manual smoke command

With the required variables loaded in a secure environment:

```bash
VIDEO_GENERATOR=template AUTO_VIDEO_ENABLED=true AUTO_VIDEO_BATCH_SIZE=1 BACKGROUND_JOB_TARGET=all pnpm automation:run
```

Do not run this command with a service-role key in a client environment or paste credentials into logs.
