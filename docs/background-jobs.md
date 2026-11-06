# Background jobs runbook

ZIKR's recurring production video queue is executed by GitHub Actions `generate-ai-video.yml`, and the social publishing queue is owned by GitHub Actions `publish-social.yml`. `scripts/run-background-jobs.ts` remains the shared worker entrypoint; CircleCI no longer executes it for production video/social work.

## Production video generation

GitHub Actions runs video generation four times per day at 03:17, 09:17, 15:17, and 21:17 UTC, with a manual dispatch path for Run Now/recovery. The social workflow is scheduled every 15 minutes and is configured with SOCIAL_PUBLISH_ENABLED=true; actual publishing remains subject to the workflow credential preflight and per-platform queue/idempotency gates. Commits and merges do not start production video generation.

GitHub Actions invokes `pnpm background:jobs` with free Hugging Face video providers (`LTX Fast` and `Wan`) enabled first and the deterministic FFmpeg template renderer as the automatic fallback. `VIDEO_FREE_ONLY=true` excludes paid/custom providers and keeps Gemini text generation off. Production generation uses trusted Quran/Hadith/Dua content, Arabic fonts, verified HTTPS Quran recitation audio, and Arabic TTS where allowed. Completed MP4 bytes are uploaded directly from the GitHub runner to Cloudinary; generated videos and human narration files must not be staged in Supabase Storage. Supabase stores only the generation queue, content metadata, and audit records. Source religious text remains locked and is never rewritten.

The queue is idempotent through `video_generation_requests.automation_key` and conditional pending claims, so scheduled reruns do not create duplicate automated jobs.

## Automatic social publishing

The dedicated GitHub Actions publisher is configured with SOCIAL_PUBLISH_ENABLED=true in .github/workflows/publish-social.yml and runs every 15 minutes. It requires the protected Supabase service-role secret, YouTube OAuth for YouTube targets, and an enabled OAuth-managed Facebook Page credential for Facebook targets. The Admin dashboard worker button dispatches operation=publish_queue. The publisher handles both video queue items and written-only items (content_type=written_post, video_url=null) using the same idempotent per-platform result ledger. Video items require completed source/status integrity; written posts are generated from approved source records by the separate written-content worker and pass source/text validation before queue insertion.

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


## Written Facebook content factory

GitHub Actions .github/workflows/generate-written-content.yml is the sole scheduled written-post generator. It runs three times per day and is deliberately separate from video generation. It uses GEMINI_API_KEY and the Supabase service-role secret in the protected production environment, selects only published/reviewed Quran, Hadith, Dua, story, prophet-section, and approved content-library records, and writes written_post rows into the existing social_publish_queue with video_url=null and target_platforms=[facebook]. The existing publish-social.yml workflow publishes these items; no second publisher or scheduler is created.

The written-content generator has a bounded daily target and per-run batch size. It stores source ID/reference, category, model/version, content hash, and quality checks. Quran, Hadith, Dua, and Adhkar source text is inserted from the source record without AI rewriting; AI may only write the surrounding hook/reflection. A rejected, malformed, insufficient, or unreviewed source is skipped and never queued. Queue duplicate checks and daily-count reads fail closed.

Published Adhkar source records are currently unavailable in the production content tables; the category remains supported in code but is disabled in the Admin selector until reviewed, published source material is seeded. The generator does not invent or reconstruct devotional formulas.

The workflow expects a GitHub Actions secret GEMINI_API_KEY in the production environment. Vercel environment variables do not automatically become GitHub Actions secrets. Configure the GitHub secret separately before expecting scheduled written content generation to run. The worker does not require or store generated video files.

## Current schedules and bounded work

```text
Video generation: 4 runs/day
Social publisher schedule: every 15 minutes; SOCIAL_PUBLISH_ENABLED=true
Admin social worker button: dispatches `publish-social.yml` with `operation=publish_queue`; no posts are sent while the global flag is false
Admin video Run Now: direct GitHub workflow dispatch from the admin action
English content sync: daily, at most 5 article translations and 25 Hadith records by default
Video length: 20 seconds by default; two bounded free-AI attempts per run, then deterministic FFmpeg fallback
```

The daily English content sync uses one shared runner for one article batch and one Hadith batch. Article work is capped at five by default and uses one configured Gemini key/model request per article; it does not retry the same batch ten times or rotate through API keys/models. Hadith work is capped at 25 records by default. Manual dispatch remains available, with script-level upper bounds.

## Recovery

Use GitHub Actions workflow dispatch for deliberate video generation, written-content generation, or social publishing recovery. Social recovery is active only when the protected workflow preflight passes and SOCIAL_PUBLISH_ENABLED=true. CircleCI is reserved for application/Android builds, documentation/release artifacts, English-content sync, Supabase gates, and explicit release operations.

The prayer notification path remains separate: Supabase `pg_cron` invokes `prayer-notification-worker` every minute.

The legacy Supabase `zikr-video-processing` job is retired, and the old Vercel compatibility endpoint has been deleted. No replacement Vercel scheduler exists.

## Safety

Queue claiming is conditional on `status=pending`, and automation keys prevent duplicate generated videos and duplicate social queue records. Provider secrets remain server-side. Translation and Hadith sync failures now return a failing process status so Actions cannot mark a partially failed batch green.

A generated video is only considered published when the provider returns its publication identifier and the queue records the provider result.

**Last updated:** October 8, 2026
