# Background jobs runbook

ZIKR's recurring production video queue is executed by GitHub Actions `generate-ai-video.yml`, and the social publishing queue is owned by GitHub Actions `publish-social.yml`. `scripts/run-background-jobs.ts` remains the shared worker entrypoint; CircleCI no longer executes it for production video/social work.

## Production video generation

GitHub Actions runs video generation four times per day at 03:17, 09:17, 15:17, and 21:17 UTC, with a manual dispatch path for Run Now/recovery. The social workflow is scheduled every 15 minutes and is configured with SOCIAL_PUBLISH_ENABLED=true; actual publishing remains subject to the workflow credential preflight and per-platform queue/idempotency gates. Commits and merges do not start production video generation.

GitHub Actions invokes `pnpm background:jobs` with free Hugging Face video providers (`LTX Fast` and `Wan`) enabled first and the deterministic FFmpeg template renderer as the automatic fallback. `VIDEO_FREE_ONLY=true` excludes paid/custom providers and keeps Gemini text generation off. Production generation uses trusted Quran/Hadith/Dua content, Arabic fonts, verified HTTPS Quran recitation audio, and Arabic TTS where allowed. Completed MP4 bytes are uploaded directly from the GitHub runner to Cloudinary; generated videos and human narration files must not be staged in Supabase Storage. Supabase stores only the generation queue, content metadata, and audit records. Source religious text remains l¶»§q«^