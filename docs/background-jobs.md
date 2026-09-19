# Background jobs runbook

Zikr has one authoritative recovery worker for the production video/social queues: GitHub Actions. The `Background Jobs` workflow is manual-only while GitHub-hosted runners are unavailable; it installs FFmpeg and Arabic fonts, validates its production configuration, and executes the deterministic template/video and social queues when deliberately dispatched.

The legacy Supabase `zikr-video-processing` job is retired and must not be recreated. The authenticated `/api/internal/video-processing` route remains a compatibility/recovery endpoint, not a scheduler. `/api/internal/video-processing` does **not** render or publish media on Vercel. This prevents Vercel runtime limits, missing FFmpeg binaries, and stale Vercel social credentials from affecting production queues.

The prayer notification path is separate: Supabase `pg_cron` invokes the `prayer-notification-worker` Edge Function every minute.

## Production video generation

Production generation is locked to the free `template` renderer. It uses trusted Quran content from `quran_ayahs`, FFmpeg, Arabic captions, optional HTTPS recitation audio, and Supabase Storage. HeyGen is not selected, submitted, polled, or required by the production queue.

The historical HeyGen columns and migrations are retained only for schema/backward compatibility. They do not participate in the active production generation path.

## Social publishing

Generated MP4 files are queued for configured platforms. YouTube uses OAuth 2.0 upload credentials; Facebook uses the Page access token and Page ID. Per-platform outcomes are tracked and partial failures are not silently reported as complete success.

## Scheduler

There is no automatic GitHub schedule for video/social queues while hosted runners are unavailable. The workflow uses `VIDEO_GENERATOR=template`, server-side credentials, and a single concurrency group for manual recovery. Do not add another automatic worker for the same queue.

No Supabase video cron is active in the current architecture. Video processing is a manual recovery operation through the GitHub Background Jobs workflow when a runner is available.

## Safety and recovery

Queue claiming is conditional on `status=pending`, and automation keys prevent duplicate generated requests and duplicate social queue records. Provider secrets remain server-side and are never committed.

For a fresh YouTube verification, inspect the provider-side upload result and the resulting `youtube_id`; database rows without a current provider upload must not be presented as proof of a successful YouTube publication.

For Facebook, verify the current GitHub Actions secret by observing a fresh worker publication result. Do not use historical Vercel logs as evidence about the current GitHub token.

**Last updated:** September 15, 2026
