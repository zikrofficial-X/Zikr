# Background jobs runbook

ZIKR's recurring production video queue is executed by GitHub Actions `generate-ai-video.yml`, and the social publishing queue is owned by GitHub Actions `publish-social.yml`. `scripts/run-background-jobs.ts` remains the shared worker entrypoint; CircleCI no longer executes it for production video/social work.

## Production video generation

GitHub Actions runs video generation four times per day at 03:17, 09:17, 15:17, and 21:17 UTC, with a manual dispatch path for Run Now/recovery. The social workflow is scheduled every 15 minutes and is enabled in production; each run remains fail-closed on required credentials, connected Page state, queue integrity, and the Admin auto-publish setting. Commits and merges do not start production video generation.

GitHub Actions invokes `pnpm background:jobs` with free Hugging Face video providers (`LTX Fast` and `Wan`) enabled first and the deterministic FFmpeg template renderer as the automatic fallback. `VIDEO_FREE_ONLY=true` excludes paid/custom providers and keeps Gemini text generation off. Production generation uses trusted Quran/Hadith/Dua content, Arabic fonts, verified HTTPS Quran recitation audio, and Arabic TTS where allowed. Completed MP4 bytes are uploaded directly from the GitHub runner to Cloudinary; generated videos and human narration files must not be staged in Supabase Storage. Supabase stores only the generation queue, content metadata, and audit records. Source religious text remains locked and is never rewritten.

The queue is idempotent through `video_generation_requests.automation_key` and conditional pending claims, so scheduled reruns do not create duplicate automated jobs.

## Automatic social publishing

The dedicated GitHub Actions publisher is configured with `SOCIAL_PUBLISH_ENABLED=true`. Scheduled runs can claim and publish eligible queue items only when the production Admin setting `video_automation_auto_publish` is also true and all provider preflight checks pass. The Admin dashboard's worker button must send `operation=publish_queue`; omitting it selects GitHub's `none` default and skips the job. The scheduled workflow processes up to two queue items per run and requires YouTube OAuth plus an enabled, connected Facebook Page credential. Facebook credentials are read from the OAuth-managed Supabase row; the readiness check never prints the Page token. Video publishing uses the source/status integrity gate; the Admin `video_automation_auto_publish` switch controls unattended posting. It consumes `social_publish_queue` entries produced by the video worker and does not render videos itself.

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

If a provider credential is missing or expired, that platform is recorded as failed instead of pretending that publication succeeded. Video generation itself remains independent from a single provider failure. Child-directed videos are identified from the source request and uploaded to YouTube with `selfDeclaredMadeForKids=true`; if the audience metadata lookup fails, YouTube publication is held.

## Current schedules and bounded work

```text
Video generation: 4 runs/day
Social publisher schedule: every 15 minutes; `SOCIAL_PUBLISH_ENABLED=true`
Admin social worker button: dispatches `publish-social.yml` with `operation=publish_queue`
Admin video Run Now: direct GitHub workflow dispatch from the admin action
English content sync: daily, at most 5 article translations and 25 Hadith records by default
Social batch size: up to 2 queue items per scheduled run
Video length: 20 seconds by default; AI attempts are bounded by the Admin setting (0–4), then deterministic FFmpeg fallback
```

The daily English content sync uses one shared runner for one article batch and one Hadith batch. Article work is capped at five by default and uses one configured Gemini key/model request per article; it does not retry the same batch ten times or rotate through API keys/models. Hadith work is capped at 25 records by default. Manual dispatch remains available, with script-level upper bounds.

## Recovery

Use GitHub Actions workflow dispatch for deliberate video generation or social publishing recovery. Social recovery can publish eligible items while `SOCIAL_PUBLISH_ENABLED=true`, subject to the Admin setting and provider readiness. CircleCI is reserved for application/Android builds, documentation/release artifacts, English-content sync, Supabase gates, and explicit release operations.

The prayer notification path remains separate: Supabase `pg_cron` invokes `prayer-notification-worker` every minute.

The legacy Supabase `zikr-video-processing` job is retired, and the old Vercel compatibility endpoint has been deleted. No replacement Vercel scheduler exists.

## Safety

Queue claiming is conditional on `status=pending`, and automation keys prevent duplicate generated videos and duplicate social queue records. Provider secrets remain server-side. Translation and Hadith sync failures now return a failing process status so Actions cannot mark a partially failed batch green.

A generated video is only considered published when the provider returns its publication identifier and the queue records the provider result.

**Last updated:** November 6, 2026
