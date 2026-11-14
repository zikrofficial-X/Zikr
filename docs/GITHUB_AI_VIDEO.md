# ZIKR Multi Provider Free Video Engine

The production automation runs directly from `.github/workflows/generate-ai-video.yml`, which executes `pnpm background:jobs` on the protected production runner. There is no Vercel/internal daily video endpoint in the active architecture.

## Provider order and cost controls

- **Hugging Face LTX Fast**, then **Wan 2.2 Fast**: the repository environment template and production workflow prefer these public free Spaces when their explicit provider flags are enabled.
- **Template**: deterministic FFmpeg renderer; it is the final fallback and does not require an AI provider key.
- **ComfyUI**: optional local GPU provider, enabled only with VIDEO_AI_ENABLED=true and COMFYUI_ENABLED=true.
- **Free API**: optional quota-based provider, enabled only with FREE_VIDEO_PROVIDER_ENABLED=true and its server-side URL/token.
- The checked-in environment template and production workflow use VIDEO_PROVIDER_ORDER=hf_ltx_fast,hf_wan,template. The router's built-in order is hf_ltx_fast,hf_wan,comfyui,free_api; provider flags and VIDEO_FREE_ONLY still gate each candidate, and the template renderer remains the final fallback.
- VIDEO_FREE_ONLY=true permits the public Hugging Face providers and the local template renderer while excluding paid/custom API paths unless separately and explicitly configured.
- “Free” never means unlimited GPU, API quota, or storage.

## Environment

Copy the video settings from `.env.example`. Important safe defaults:

```text
VIDEO_PROVIDER_ORDER=hf_ltx_fast,hf_wan,template
VIDEO_FREE_ONLY=true
VIDEO_AI_ENABLED=true
HF_LTX_FAST_VIDEO_ENABLED=false
HF_WAN_VIDEO_ENABLED=false
COMFYUI_ENABLED=false
COMFYUI_MODEL=wan2.1
COMFYUI_WAN_WORKFLOW_JSON=
COMFYUI_LTX_WORKFLOW_JSON=
FREE_VIDEO_PROVIDER_ENABLED=false
VIDEO_DAILY_LIMIT=10
VIDEO_MAX_RETRIES=3
VIDEO_DEFAULT_FORMAT=vertical
VIDEO_DEFAULT_DURATION=8
VIDEO_TIMEZONE=Asia/Riyadh
VIDEO_AUTOMATION_DRY_RUN=true
DAILY_VIDEO_TARGET=5
AUTO_VIDEO_PUBLISH_ENABLED=false
AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL=true
INTERNAL_JOB_SECRET=
```

Secrets are server-side only. Provider tokens are never returned in errors or logs.

## Pipeline and safety

1. Seed source-locked requests with an idempotent key and SHA-256 `content_hash`/`source_hash`.
2. Claim a pending or due `retry_wait` request conditionally.
3. Revalidate the current published source; Quran, hadith, dua, adhkar, and verified stories cannot be edited through a request payload.
4. Select a provider, render/finalize with Arabic audio and subtitles, apply full-frame visual fitting, motion, voice compression and loudness normalization, and validate with `ffprobe`.
5. Upload only validated MP4 output directly to Cloudinary. The worker requires the Cloudinary cloud name, API key, and API secret; it fails closed rather than falling back to Supabase Storage.
6. Store the Cloudinary playback URL and queue/catalog metadata in Supabase. Supabase remains the database/queue layer; generated public MP4 files are not staged in a Supabase bucket.
7. Mark completed; only then can an automated-QA-approved social candidate be queued.
8. External publishing remains separately gated by the Admin auto-publish setting, workflow/provider readiness, and the persisted QA snapshot.

The database migration `20261002100000_multi_provider_free_video_engine.sql` is additive and creates `video_automation_runs` for audit metrics. It does not delete videos or data.

## Dry run and daily worker

With `VIDEO_AUTOMATION_DRY_RUN=true`, the video worker does not seed or render requests, upload assets, or publish scheduled internal site content; the shared runner skips `content_publish_queue` for `videos` and `all` targets. This is not a dry run for the separate social publisher: keep `SOCIAL_PUBLISH_ENABLED=false` and use `BACKGROUND_JOB_TARGET=videos` for a no-social-publish rehearsal. The daily job name is `daily_verified_video_seed`. The existing GitHub Actions workflow is the scheduler; do not add a second recurring scheduler. The internal route requires `x-internal-job-secret` or a matching Bearer token.

Run locally:

```bash
pnpm install --frozen-lockfile
pnpm video:engine:check
pnpm background:jobs
```

For a real controlled run, set `VIDEO_AUTOMATION_DRY_RUN=false` and provide Supabase service-role access. Keep social publishing disabled while validating several MP4s manually.

## ComfyUI

ComfyUI is optional and must already be installed on a GPU machine. The same provider supports two free local workflows without changing the queue:

- **Wan2.1** (`COMFYUI_MODEL=wan2.1`): the lightweight official workflow is suitable for roughly 8 GB VRAM according to the [Wan2.1 project](https://github.com/Wan-Video/Wan2.1).
- **LTX-Video** (`COMFYUI_MODEL=ltx`): use a compatible LTX workflow for faster local short clips when its model is installed.

Set `COMFYUI_BASE_URL`, enable the flags, and provide the JSON workflow in `COMFYUI_WAN_WORKFLOW_JSON` or `COMFYUI_LTX_WORKFLOW_JSON`. The placeholders `{{PROMPT}}`, `{{REQUEST_ID}}`, and `{{TITLE}}` are replaced safely. The provider performs a health check, queues work, polls with a deadline, downloads the result, and sends a best-effort interrupt on timeout. Models are never downloaded automatically on production servers.

## Monitoring and recovery

Inspect `video_generation_requests` for `pending`, `processing`, `retry_wait`, `completed`, `failed`, and `cancelled`. A stale processing request is returned to `pending` after `VIDEO_STALE_AFTER_MINUTES`. Failed renders use bounded exponential-style backoff and never enter the social queue. Review `video_automation_runs` and GitHub Actions logs for provider counts and compact error summaries.

## Validation commands

```bash
pnpm check
pnpm lint
pnpm routes:check
pnpm content:check
pnpm video:engine:check
pnpm build
```

A video may only be called successful when a real MP4 exists and `ffprobe` confirms a valid duration, resolution, H.264 video stream, required AAC audio stream, Arabic metadata, and non-silent audio. The current renderer contract is 2026-11-07-template-controls-v10. Its FFmpeg assembly defaults to CRF 18, 30 fps, full-frame composition, gentle sharpening, dynamic background motion, AAC 192k audio, compressor, and -16 LUFS loudness normalization; override VIDEO_OUTPUT_CRF and VIDEO_AUDIO_BITRATE only when a platform-specific delivery profile requires it.
