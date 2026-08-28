# Background jobs runbook

Zikr has one authoritative automatic owner for the production background queues. Supabase `pg_cron` invokes the authenticated Vercel route `/api/internal/video-processing` every minute. That route claims pending video and social rows, polls persisted HeyGen jobs, and performs configured provider publishing with server-side credentials.

The prayer notification path is separate: Supabase `pg_cron` invokes the `prayer-notification-worker` Edge Function every minute. Do not route prayer dispatch through the video queue or add another scheduler for it.

## Current ownership

| Queue | Automatic owner | Schedule | Recovery path |
|---|---|---:|---|
| `video_generation_requests` | `zikr-video-processing` → `/api/internal/video-processing` | Every minute | GitHub `Background Jobs` with `target=videos`, when runners are available |
| `social_publish_queue` | `zikr-video-processing` → `/api/internal/video-processing` | Every minute | GitHub `Background Jobs` with `target=social`, when runners are available |
| Prayer Web Push | `zikr-prayer-push-dispatch` → Supabase Edge Function | Every minute | Inspect delivery ledger and Edge Function logs |

The GitHub-hosted runners are currently unavailable because GitHub reports an account-level billing lock. Consequently, `.github/workflows/background-jobs.yml` is `workflow_dispatch`-only and is not part of the production schedule. Vercel deployment verification is independent and runs `pnpm verify` on every deployment.

## Production processing flow

The Vercel route rejects requests without the scheduler bearer secret. It reads already-submitted video jobs first so a provider job can outlive one request, then claims pending rows with a conditional `status=eq.pending` update. This prevents overlapping invocations from processing the same pending row twice. The route processes only explicit administrator-reviewed narration and never derives religious narration from a title or short description.

For social publishing, the same request claims queue rows before making external side-effect calls. Provider credentials remain server-only. A partial provider result is recorded as partial or failed rather than being silently reported as complete.

## Manual recovery

Use manual recovery only after confirming that automatic processing is unavailable or a specific queue needs operator intervention. Once GitHub runner access is restored:

```bash
gh workflow run background-jobs.yml --repo mohamedalaa7785-cpu/Zikr -f target=videos
gh workflow run background-jobs.yml --repo mohamedalaa7785-cpu/Zikr -f target=social
gh workflow run background-jobs.yml --repo mohamedalaa7785-cpu/Zikr -f target=all
```

The current workflow input is `target`; the old `job_type` input is invalid. Confirm the resulting row status and provider-side publication before repeating a recovery run. A GitHub runner failure caused by billing should not be treated as a queue-processing failure.

## Operational checks

Inspect `cron.job` and confirm exactly one active `zikr-video-processing` row. Inspect recent `cron.job_run_details` to confirm successful invocations. For stuck rows, inspect `video_generation_requests.heygen_video_id`, `heygen_status`, `error_message`, and `updated_at`; inspect `video_publish_log` for provider outcomes. For social rows, inspect the queue status and publish log before retrying.

The scheduler secret is read server-side through the service-role-only `get_push_scheduler_secret` function. Never place it in a client bundle, a browser request, a public documentation example, or a GitHub issue.

## Do not create duplicate schedulers

Do not restore a GitHub cron trigger, add a Vercel Cron entry, or create another database cron row while `zikr-video-processing` is active. Duplicate schedulers can submit duplicate HeyGen jobs or publish the same media more than once. Any future scheduler change must first document the queue owner, credentials, timeout limits, retry semantics, and idempotency controls.

## Provider limitations

The queue may remain pending or fail when HeyGen, YouTube, or Facebook credentials are absent, expired, or out of quota. Those are integration-state failures, not reasons to bypass authentication or to create a second worker. Provider credentials must be rotated in the server-side environment and the queue retried only after the underlying error is understood.

**Last updated:** August 15, 2026
