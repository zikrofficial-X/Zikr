# ZIKR Multi Provider Free Video Engine

The production automation runs from `.github/workflows/generate-ai-video.yml` and the protected endpoint `/api/internal/video-generation/daily`. The existing template renderer remains the default and is not replaced.

## Provider order and cost controls

- **Template**: deterministic FFmpeg renderer; works without AI keys and is the default.
- **ComfyUI**: optional local GPU provider, enabled only with `VIDEO_AI_ENABLED=true` and `COMFYUI_ENABLED=true`.
- **Free API**: optional quota-based provider, enabled only with `FREE_VIDEO_PROVIDER_ENABLED=true` and its server-side URL/token.
- The router falls back to the next available provider and ultimately to the template path.
- “Free” never means unlimited GPU, API quota, or storage.

## Environment

Copy the video settings from `.env.example`. Important safe defaults:

```text
VIDEO_PROVIDER_ORDER=template,comfyui,free_api
VIDEO_AI_ENABLED=false
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
4. Select a provider, render/finalize with Arabic audio and subtitles, and validate with `ffprobe`.
5. Upload only validated MP4 output to the existing `videos` bucket.
6. Mark `completed`; only then can a social draft be queued.
7. Public publishing remains disabled unless the two explicit approval flags allow it and credentials exist.

The database migration `20261002100000_multi_provider_free_video_engine.sql` is additive and creates `video_automation_runs` for audit metrics. It does not delete videos or data.

## Dry run and daily worker

With `VIDEO_AUTOMATION_DRY_RUN=true`, the worker only plans/records what it would do; it does not generate, upload, or publish. The daily job name is `daily_verified_video_seed`. The existing GitHub Actions workflow is the scheduler; do not add a second recurring scheduler. The internal route requires `x-internal-job-secret` or a matching Bearer token.

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

A video may only be called successful when a real MP4 exists and `ffprobe` confirms a valid duration, resolution, H.264 video stream, required AAC audio stream, Arabic metadata, and non-silent audio.
