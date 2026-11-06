# Background jobs runbook

ZIKR's recurring production video queue is executed by GitHub Actions `generate-ai-video.yml`. External social publishing is a separate, automated-QA-gated worker in `publish-social.yml`, triggered only after successful video generation or explicit manual dispatch. `scripts/run-background-jobs.ts` is the shared worker entrypoint; CircleCI does not execute it for production video/social work.

## Production video generation

GitHub Actions runs video generation four times per day at 03:17, 09:17, 15:17, and 21:17 UTC, with a manual dispatch path for Run Now/recovery. The social workflow has no polling schedule and does not run on source pushes. A successful video-generation run triggers a separate social job; manual recovery is available only from main. Commits and merges do not start production video generation.

GitHub Actions invokes `pnpm background:jobs` with free Hugging Face video providers (`LTX Fast` and `Wan`) enabled first and the deterministic FFmpeg template renderer as the automatic fallback. `VIDEO_FREE_ONLY=true` excludes paid/custom providers and keeps Gemini text generation off. Production generation uses trusted Quran/Hadith/Dua content, Arabic fonts, verified HTTPS Quran recitation audio, and Arabic TTS where allowed. Completed MP4 bytes are uploaded directly from the GitHub runner to Cloudinary; generated videos and human narration files must not be staged in Supabase Storage. Supabase stores only the generation queue, content metadata, and audit records. Source religious text remains locked and is never rewritten.

The queue is idempotent through `video_generation_requests.automation_key` and conditional pending claims, so scheduled reruns do not create duplicate automated jobs.

## Automated-QA external social publishing

The social publisher runs separately from rendering. A successful `generate-ai-video.yml` run may trigger `publish-social.yml`; an administrator may also dispatch the social workflow manually. It is not a 15-minute poller and has no push trigger. The workflow validates stored Facebook Page credentials and the stored YouTube OAuth scopes before enabling each provider. YouTube requires `youtube.upload`, `youtube.readonly`, and `yt-analytics.readonly`; no channel-delete scope is requested. If neither provider is verified, no queue row is claimed.

Only rows created on or after `SOCIAL_PUBLISH_AFTER` are eligible. Historical social queue records are not replayed. Videos require a complete automated five-part QA result (source, audio, visuals, captions, rights) bound to the exact source/content/template/MP4 fingerprint. The social worker rechecks this approval immediately before every provider call; no manual review or click is required. Published provider IDs are persisted per platform, so a retry may only target unfinished platforms. Insights sync is opt-in and remains off during publishing runs to limit database reads.

The video generation worker stores verified MP4 files in Cloudinary and registers them in the ZIKR `videos` catalog. Internal site publication uses `content_publish_queue` with `content_table=videos`; external social delivery uses a separate `social_publish_queue` worker. Both paths are independent.

## Written internal site content generator

GitHub Actions `.github/workflows/generate-written-content.yml` creates draft ZIKR website articles from approved source records. It runs three times per day and is separate from video generation. It uses `GEMINI_API_KEY` and the Supabase service-role secret in the protected production environment. Generated articles are inserted into `articles` as unpublished records and scheduled through `content_publish_queue` with `content_table=articles`. It does not write to `social_publish_queue` and does not publish to external platforms.

The generator has a bounded daily target and per-run batch size. It stores source ID/reference, category, model/version, content hash, and quality checks. Quran, Hadith, Dua, and Adhkar source text is inserted from the source record without AI rewriting; AI may only write the surrounding hook/reflection. A rejected, malformed, insufficient, or unreviewed source is skipped and never queued. Queue duplicate checks and daily-count reads fail closed.

Published Adhkar source records are currently unavailable in the production content tables; the category remains supported in code but is disabled in the Admin selector until reviewed, published source material is seeded. The generator does not invent or reconstruct devotional formulas.

The workflow expects a GitHub Actions secret `GEMINI_API_KEY` in the production environment. Vercel environment variables do not automatically become GitHub Actions secrets. Configure the GitHub secret separately before expecting scheduled written content generation to run. The worker does not require or store generated video files.

## Current schedules and bounded work

```text
Video generation: 4 runs/day
Social publisher: after successful video generation or manual dispatch; up to 5 eligible videos per dispatch, no recurring polling schedule
Admin social worker button: dispatches `publish-social.yml` with `operation=publish_queue`; provider preflight + admin auto-publish setting + per-video automated QA approval are all required
Admin video Run Now: direct GitHub workflow dispatch from the admin action
English content sync: daily, at most 5 article translations and 25 Hadith records by default
Video length: 25 seconds by default; two bounded free-AI attempts per run, then deterministic FFmpeg fallback
```

The daily English content sync uses one shared runner for one article batch and one Hadith batch. Article work is capped at five by default and uses one configured Gemini key/model request per article; it does not retry the same batch ten times or rotate through API keys/models. Hadith work is capped at 25 records by default. Manual dispatch remains available, with script-level upper bounds.

## Recovery

Use GitHub Actions workflow dispatch for deliberate video generation, written-content generation, or social publishing recovery. Social recovery is active only when the protected workflow preflight passes, `SOCIAL_PUBLISH_ENABLED=true`, the administrator has enabled auto-publish, and each video has passed human QA. CircleCI is reserved for application/Android builds, documentation/release artifacts, English-content sync, Supabase gates, and explicit release operations.

The prayer notification path remains separate: Supabase `pg_cron` invokes `prayer-notification-worker` every minute.

The legacy Supabase `zikr-video-processing` job is retired, and the old Vercel compatibility endpoint has been deleted. No replacement Vercel scheduler exists.

## Safety

Queue claiming is conditional on `status=pending`, and automation keys prevent duplicate generated videos and duplicate social queue records. Provider secrets remain server-side. Translation and Hadith sync failures now return a failing process status so Actions cannot mark a partially failed batch green.

A generated video is only considered published when the provider returns its publication identifier and the queue records the provider result.

**Last updated:** November 6, 2026
