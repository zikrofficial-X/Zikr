# Background jobs runbook

Zikr has one authoritative automatic owner for the production background queues. Supabase `pg_cron` invokes the authenticated Vercel route `/api/internal/video-processing` every minute. That route seeds and processes the free deterministic FFmpeg video queue, then processes configured social publishing with server-side credentials.

The prayer notification path is separate: Supabase `pg_cron` invokes the `prayer-notification-worker` Edge Function every minute.

## Production video generation

Production generation is locked to the free `template` renderer. It uses trusted Quran content from `quran_ayahs`, FFmpeg, Arabic captions, optional HTTPS recitation audio, and Supabase Storage. HeyGen is not selected, submitted, polled, or required by the production queue.

The historical HeyGen columns and migrations are retained only for schema/backward compatibility. They do not participate in the active production generation path.

## Social publishing

Generated MP4 files are queued for configured platforms. YouTube uses OAuth 2.0 upload credentials; Facebook uses the Page access token and Page ID. Per-platform outcomes are tracked and partial failures are not silently reported as complete success.

## Scheduler

Supabase `zikr-video-processing` remains the authoritative production scheduler. Do not add a duplicate Vercel Cron or database cron job for the same queue.

The GitHub background workflow is a recovery/manual path when GitHub runners are available and is locked to the same free renderer.

## Safety and recovery

Queue claiming is conditional on `status=pending`, and automation keys prevent duplicate generated requests and duplicate social queue records. Provider secrets remain server-side and are never committed.

For a fresh YouTube verification, inspect the provider-side upload result and the resulting `youtube_id`; database rows without a current provider upload must not be presented as proof of a successful YouTube publication.

**Last updated:** September 14, 2026
