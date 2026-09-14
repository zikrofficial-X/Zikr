# Background jobs runbook

Zikr has one authoritative automatic owner for the production background queues. Supabase `pg_cron` invokes the authenticated Vercel route `/api/internal/video-processing` every minute. That route seeds and processes the free deterministic FFmpeg video queue, then processes configured social publishing with server-side credentials.

The prayer notification path is separate: Supabase `pg_cron` invokes the `prayer-notification-worker` Edge Function every minute. Do not route prayer dispatch through the video queue or add another scheduler for it.

## Current ownership

| Queue | Automatic owner | Schedule | Recovery path |
|---|---|---:|---|
| `video_generation_requests` | `zikr-video-processing` → `/api/internal/video-processing` | Every minute | GitHub `Background Jobs` with `target=videos`, when runners are available |
| `social_publish_queue` | `zikr-video-processing` → `/api/internal/video-processing` | Every minute | GitHub `Background Jobs` with `target=social`, when runners are available |
| Prayer Web Push | `zikr-prayer-push-dispatch` → Supabase Edge Function | Every minute | Inspect delivery ledger and Edge Function logs |

The GitHub-hosted runners may be unavailable because of the account-level billing restriction documented in project audit evidence. Production scheduling does not depend on them: Supabase `pg_cron` owns the production video/social queue, while the GitHub workflow remains a recovery/manual path.

## Production processing flow

The production route rejects requests without the scheduler bearer secret. It seeds deterministic Quran video requests, claims only `pending` template rows with a conditional status update, renders each MP4 locally with FFmpeg and Arabic captions, uploads the result to the public `videos` Supabase Storage bucket, and then queues social publishing. This production path does not call HeyGen, does not poll HeyGen jobs, and does not require a paid video provider or GPU API.

The actual renderer is `scripts/jobs/template-video-automation.ts`. It uses the stored Quran text and optional HTTPS recitation audio, produces a 1080x1920 MP4, and persists the resulting `video_url`. The renderer is deliberately deterministic so an unavailable third-party AI provider cannot block or duplicate production videos.

For social publishing, the same request claims queue rows before making external side-effect calls. Provider credentials remain server-only. A partial provider result is recorded as partial or failed rather than being silently reported as complete.

## Manual recovery

Use manual recovery only after confirming that automatic processing is unavailable or a specific queue needs operator intervention. Once GitHub runner access is available:

```bash
gh workflow run background-jobs.yml --repo Zikrmediaofficial/Zikr -f target=videos
gh workflow run background-jobs.yml --repo Zikrmediaofficial/Zikr -f target=social
gh workflow run background-jobs.yml --repo Zikrmediaofficial/Zikr -f target=all
```

The workflow input is `target`; the old `job_type` input is invalid. The runner is locked to the free `template` renderer and does not accept an environment value that routes production work to HeyGen.

## Operational checks

Inspect `cron.job` and confirm exactly one active `zikr-video-processing` row. Inspect recent `cron.job_run_details` to confirm successful invocations. For stuck video rows, inspect `status`, `video_url`, `error_message`, and `updated_at`. Legacy HeyGen columns may still exist in the database for historical compatibility, but they are not read or used by the production renderer. Inspect `video_publish_log` and `social_publish_queue` for YouTube/Facebook outcomes before retrying.

The scheduler secret is read server-side through the service-role-only `get_push_scheduler_secret` function. Never place it in a client bundle, a browser request, a public documentation example, or a GitHub issue.

## Do not create duplicate schedulers

Do not add another Vercel Cron entry or create another database cron row while `zikr-video-processing` is active. Duplicate schedulers can publish the same media more than once. Any future scheduler change must first document the queue owner, credentials, timeout limits, retry semantics, and idempotency controls.

## Provider limitations

Video generation itself is provider-independent in production. YouTube and Facebook publication can still fail independently when their OAuth/Page credentials are absent, expired, or out of quota. Those integration-state failures do not require changing the free video renderer.

**Last updated:** September 14, 2026
