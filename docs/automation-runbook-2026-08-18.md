# ZIKR autonomous media automation runbook

## What is implemented

The production video generator is locked to `VIDEO_GENERATOR=template`. It selects a Quran ayah already stored in `quran_ayahs`, creates a deterministic 9:16 MP4 using FFmpeg and Arabic subtitles, uploads it to the public `videos` Supabase Storage bucket, marks the durable request completed, and queues social publishing only when the corresponding server-side credentials are configured.

The generator does not invent Quran text, tafsir, hadith, religious rulings, or narration. Every automated Quran video stores `sourceUrl`, `sourceLabel`, `surahId`, and `ayahNumber` in the request JSON. The source URL is a direct Quran.com ayah URL.

The queue is idempotent. `video_generation_requests.automation_key` and `social_publish_queue.automation_key` have partial unique indexes, so rerunning a schedule does not create duplicate generated videos or duplicate social queue entries.

HeyGen is retired from the production execution path. The production renderer does not select, submit, or poll HeyGen jobs. Legacy database columns are retained only for migration/history compatibility.

## Required production environment variables

Set these as protected server-side variables. Values must never be committed:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side database and Storage writes only |
| `SUPABASE_ANON_KEY` | Existing server environment compatibility |
| `NEXT_PUBLIC_SITE_URL` | Canonical public ZIKR URL |
| `YOUTUBE_CLIENT_ID` | Optional YouTube OAuth client ID |
| `YOUTUBE_CLIENT_SECRET` | Optional YouTube OAuth client secret |
| `YOUTUBE_REFRESH_TOKEN` | Optional server-side YouTube refresh token |
| `YOUTUBE_CHANNEL_ID` | Optional YouTube target channel |
| `FACEBOOK_PAGE_ID` | Optional Facebook Page ID |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Optional server-side Page access token |
| `FACEBOOK_GRAPH_API_VERSION` | Meta Graph API version used by the canonical publisher |

No HeyGen variable is required for production generation.

## Production scheduler

The `GitHub Background Jobs` workflow is the manual recovery owner for video and social queues while GitHub hosted runners are unavailable. It has no production schedule. It invokes `pnpm background:jobs`, which seeds automated requests, renders with the free FFmpeg template worker, and processes the social publishing queue.

The legacy Supabase `zikr-video-processing` cron that called `/api/internal/video-processing` has been explicitly retired by migration `20260915004110_retire_vercel_video_processing_cron.sql`. Do not create or restore a second scheduler for the same queue.

## Publishing behavior

YouTube uses the existing OAuth upload implementation. A refresh token and upload-capable OAuth credentials are required; an API key alone is not sufficient for uploads.

Facebook publishing is independent of video generation. A valid Page access token and Page ID are required for automatic Page/Reels publication. The canonical configuration key is `FACEBOOK_GRAPH_API_VERSION`.

## Failure handling

A failed render is recorded in `video_generation_requests.error_message` and `error_details`. A failed social target is recorded in `social_publish_queue.error_message` with per-platform results. The queue is not silently marked published. Re-running the worker is safe because claims are conditional and idempotency keys prevent duplicate queue inserts.

## Manual smoke command

With the required variables loaded in a secure server environment:

```bash
VIDEO_GENERATOR=template AUTO_VIDEO_ENABLED=true AUTO_VIDEO_BATCH_SIZE=1 BACKGROUND_JOB_TARGET=all pnpm background:jobs
```

Do not run this command with a service-role key in a browser/client environment or paste credentials into logs.
