# Background jobs runbook

ZIKR's production video and social queues are executed outside GitHub Actions.

The authoritative recovery worker is the CircleCI `background-jobs` job. It installs FFmpeg and Arabic fonts, validates protected runtime configuration, and executes the deterministic template/video and social queues when the corresponding CircleCI pipeline parameter is deliberately enabled.

GitHub Actions workflows are retired from the repository and must not be recreated.

The legacy Supabase `zikr-video-processing` job is retired and must not be recreated. The authenticated `/api/internal/video-processing` route remains a compatibility/recovery endpoint, not a scheduler. The route does **not** render or publish media on Vercel.

The prayer notification path is separate: Supabase `pg_cron` invokes the `prayer-notification-worker` Edge Function every minute.

## Production video generation

Production generation is locked to the free `template` renderer. It uses trusted Quran content from `quran_ayahs`, FFmpeg, Arabic captions, optional HTTPS recitation audio, and Supabase Storage. HeyGen is not selected, submitted, polled, or required by the production queue.

Historical HeyGen columns and migrations are retained only for schema/backward compatibility.

## Social publishing

Generated MP4 files are queued for configured platforms. YouTube uses OAuth 2.0 upload credentials; Facebook uses the Page access token and Page ID. Per-platform outcomes are tracked and partial failures are not silently reported as complete success.

## CircleCI execution

Operational jobs are disabled by default and run only when their pipeline parameter is explicitly enabled.

Background processing:

```text
run_background_jobs=true
background_target=all|videos|social
```

The CircleCI job sets:

```text
VIDEO_GENERATOR=template
AUTO_VIDEO_ENABLED=true
```

and uses protected project/context variables for Supabase, YouTube, and Facebook credentials.

Quran audio import is a separate opt-in job:

```text
run_quran_audio_import=true
```

It executes `scripts/import-quran-audio-to-supabase.mjs` with protected Supabase credentials and configurable file-size/concurrency limits.

Production smoke and security audit are also opt-in CircleCI jobs:

```text
run_production_smoke=true
run_security_audit=true
```

## No automatic duplicate scheduler

There is no automatic GitHub Actions schedule for video/social queues and no active Supabase video cron in the current architecture. CircleCI operational jobs are manual by parameter to avoid turning the CI provider into an uncontrolled production scheduler.

Do not add another Vercel Cron, Supabase video cron, GitHub workflow, or duplicate worker for the same queue.

## Safety and recovery

Queue claiming is conditional on `status=pending`, and automation keys prevent duplicate generated requests and duplicate social queue records. Provider secrets remain server-side and are never committed.

For a fresh YouTube verification, inspect the provider-side upload result and resulting `youtube_id`; database rows without a current provider upload must not be presented as proof of successful publication.

For Facebook, verify the current protected CircleCI provider variables through a fresh worker result. Do not use historical GitHub Actions or Vercel logs as evidence about current publishing credentials.

**Last updated:** September 19, 2026
