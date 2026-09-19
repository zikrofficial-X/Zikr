# ZIKR Production Scheduling

ZIKR has one authoritative automatic scheduler per production workload.

| Workload | Authoritative execution owner | Cadence | Safety boundary |
|---|---|---:|---|
| Prayer Web Push planning and delivery | Supabase `pg_cron` → `prayer-notification-worker` | Every minute | Private scheduler token, per-device uniqueness, atomic claims, bounded retries, invalid-subscription deactivation. |
| Client-local azan and reminder sounds | Browser / native client | While active | Local/offline fallback; it does not create server delivery rows. |
| Video generation queue | GitHub `Background Jobs` → `pnpm background:jobs` → template/FFmpeg worker | Manual recovery | Persisted queue, deterministic renderer, Supabase Storage, server-side service credentials. |
| Social publishing queue | GitHub `Background Jobs` → `pnpm background:jobs` → social publisher | Manual recovery | Queue claims, idempotency keys, provider credentials server-side, bounded retries and platform result tracking. |
| Repository verification | Vercel build gate | Every deployment | `pnpm verify` must pass before the deployment is published. |

## Scheduler ownership

The Supabase migration `20260915004110_retire_vercel_video_processing_cron.sql` explicitly retires the legacy `zikr-video-processing` cron job. This prevents the old Vercel route from competing with the GitHub worker.

The GitHub `Background Jobs` workflow is the canonical manual recovery worker for video and social processing while hosted runners are unavailable. Do not add a second GitHub schedule, Vercel Cron job, or Supabase video cron.

## Prayer Web Push lifecycle

A signed-in user selects a location on `/prayer-times` and explicitly enables background prayer alerts in `/settings`. The browser registers its Push API subscription only after notification permission is granted. The authenticated API persists the device subscription, location, and enabled-prayer preferences while enforcing ownership on the server.

The minute worker uses protected server-side VAPID configuration. Private scheduler credentials and VAPID private material are never returned to the browser or committed to the repository.

Each delivery uses a unique subscription/prayer/time key and is claimed before sending. Stale claims are recoverable and transient provider failures use bounded retry behavior.

## Video and social lifecycle

```text
video_generation_requests
        │
        ▼
GitHub Background Jobs (manual recovery)
        │
        ├── seed queue items
        ├── FFmpeg template renderer
        ├── Supabase Storage
        └── social_publish_queue
                    │
                    ├── YouTube OAuth upload
                    └── Facebook / Reels publish
```

Production video generation is intentionally locked to the free deterministic FFmpeg renderer. HeyGen fields/migrations remain only for historical compatibility and must not become an alternate production execution path.

The worker requires a direct HTTPS media URL for social publication and rejects YouTube watch URLs as media sources. Social queue items record platform-level success/failure and retry only the unfinished platforms.

## GitHub runner recovery

`Background Jobs` is manual-only while GitHub-hosted runners are unavailable; it has no production schedule. Use it only for deliberate recovery after runner access is restored. `Continuous Integration` remains manual-only when hosted runners are restricted for the account.

When the GitHub runner cannot start, do not add an alternate scheduler. Run `pnpm verify` locally or rely on the Vercel deployment gate for repository validation, then process the queue once runner access is restored.

## Supabase Preview integration

Supabase Preview/automatic branching is separate from production scheduling. Do not reset production migration history or mark unseen versions as applied merely to make a preview branch match production. Historical migrations remain part of the canonical repository chain.
