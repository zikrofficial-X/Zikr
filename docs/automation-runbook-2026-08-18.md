# ZIKR autonomous media automation runbook

## What is implemented

The production video generator is locked to `VIDEO_GENERATOR=template`. It selects a Quran ayah already stored in `quran_ayahs`, creates a deterministic 9:16 MP4 using FFmpeg and Arabic subtitles, uploads it to the public `videos` Supabase Storage bucket, marks the durable request completed, and queues social publishing only when the corresponding server-side credentials are configured.

The generator does not invent Quran text, tafsir, hadith, religious rulings, or narration. Every automated Quran video stores `sourceUrl`, `sourceLabel`, `surahId`, and `ayahNumber` in the request JSON. The source URL is a direct Quran.com ayah URL.

The queue is idempotent. `video_generation_requests.automation_key` and `social_publish_queue.automation_key` have partial unique indexes, so rerunning a schedule does not create duplicate generated videos or duplicate social queue entries.

HeyGen is retired from the production execution path. The production route and scheduled runner do not pass, select, submit, or poll HeyGen jobs. Legacy database columns are retained only for migration/history compatibility and are not used by the renderer.

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

No HeyGen variable is required.

## Production scheduler

Supabase `pg_cron` invokes `/api/internal/video-processing` every minute with the scheduler bearer secret. The route is the authoritative production queue owner. Do not create a second scheduler for the same queue.

The GitHub `Background Jobs` workflow is a manual/recovery path when GitHub runners are available. It is also locked to the free `template` renderer and cannot route work to HeyGen.

## Publishing behavior

YouTube uses the existing OAuth upload implementation. YouTube's official API requires an OAuth token with an upload-capable scope such as `youtube.upload`; an API key alone cannot upload videos. Unverified API projects may have uploaded videos restricted to private visibility until the required Google audit is completed.

Facebook publishing is independent of video generation. A valid Page access token and Page ID are required for automatic Page/Reels publication.

## Failure handling

A failed render is recorded in `video_generation_requests.error_message` and `error_details`. A failed social target is recorded in `social_publish_queue.error_message` with per-platform results. The queue is not silently marked published. Re-running the scheduler is safe because claims are conditional on the queued status and idempotency keys prevent duplicate inserts.

## Manual smoke command

With the required variables loaded in a secure environment:

```bash
VIDEO_GENERATOR=template AUTO_VIDEO_ENABLED=true AUTO_VIDEO_BATCH_SIZE=1 BACKGROUND_JOB_TARGET=all pnpm automation:run
```

Do not run this command with a service-role key in a client environment or paste credentials into logs.
