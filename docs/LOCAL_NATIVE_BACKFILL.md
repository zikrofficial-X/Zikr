# Local Native YouTube → Facebook Backfill

The native backfill is intentionally local so large original files do not need to be stored in Supabase.

## Requirements

- Node.js 22+
- `yt-dlp` available on PATH
- A YouTube Data API key and the channel ID already configured for ZIKR
- A Facebook Page access token with the Page publishing permissions required by Meta
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SOCIAL_SYNC_SECRET`, `YOUTUBE_CHANNEL_ID`, `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN`

## Run one video first

```bash
pnpm social:backfill:native -- --limit 1
```

The script downloads one YouTube video temporarily, uploads it to Facebook using the Page Video resumable upload flow, records the resulting Facebook ID in `social_sync_jobs`, and deletes the temporary local file unless `--keep-files` is supplied.

## Run the remaining queue

```bash
pnpm social:backfill:native -- --limit 100
```

The script never publishes a YouTube link and never marks a job as published unless Facebook accepts the native video upload.
