# Free native YouTube → Facebook backfill

This workflow is designed for videos that belong to the configured YouTube channel.
It uses Google Takeout/YouTube Studio for the original MP4 files, then uploads each file **directly to the Facebook Page** from the local machine. Supabase stores only queue/status metadata; it is not used as a long-term video archive.

## Why this path

YouTube Data API provides metadata but not an official MP4 download endpoint. Google provides MP4 downloads for videos you uploaded and Google Takeout for downloading all uploaded videos.

Supabase Free Storage is limited to 1 GB total and 50 MB maximum file size, so the importer deliberately avoids using Supabase Storage for large original videos.

## 1. Export the videos

Use Google Takeout and select YouTube. Choose an archive destination you can access locally. Download and extract the archive.

Official help: https://support.google.com/youtube/answer/56100

## 2. Prepare local environment

Node.js 22+ is required.

Set these environment variables in the terminal session only:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SOCIAL_SYNC_SECRET`
- `YOUTUBE_CHANNEL_ID`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `FACEBOOK_GRAPH_API_VERSION`

Never commit these values and never put them in a browser/client bundle.

## 3. Dry-run matching

From the repository root:

```bash
node scripts/import-youtube-takeout-native-facebook.mjs --takeout-dir /path/to/extracted/Takeout --dry-run
```

The command scans video files and secondary JSON metadata and shows how many files can be matched to the queued YouTube videos. It does not upload or publish anything in dry-run mode.

## 4. Native backfill

After the dry run:

```bash
node scripts/import-youtube-takeout-native-facebook.mjs --takeout-dir /path/to/extracted/Takeout
```

The importer:

1. Reads the current `social_sync_jobs` queue.
2. Matches each job to a Takeout MP4 using YouTube ID metadata first, then conservative title matching.
3. Uploads the matched file directly to `/{page-id}/videos` on the configured Graph API version.
4. Records the returned Facebook post/video ID in Supabase.
5. Marks the job `published` only after Facebook confirms an ID.
6. Leaves unmatched jobs as `waiting_media`.
7. Never publishes a YouTube watch URL as a fallback.
8. Processes one video at a time and never stores the whole archive in Supabase.

## Important safety rule

Do not run a full backfill until the first test video is verified manually on the target Facebook Page as a native video. The importer is designed to preserve the queue and stop on individual failures rather than mark failed uploads as published.
