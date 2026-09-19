# ZIKR Production Scheduling

ZIKR has one authoritative execution owner per production workload.

| Workload | Authoritative execution owner | Cadence | Safety boundary |
|---|---|---:|---|
| Prayer Web Push planning and delivery | Supabase `pg_cron` → `prayer-notification-worker` | Every minute | Private scheduler token, per-device uniqueness, atomic claims, bounded retries, invalid-subscription deactivation. |
| Client-local azan and reminder sounds | Browser / native client | While active | Local/offline fallback; it does not create server delivery rows. |
| Video generation queue | CircleCI `background-jobs` → `pnpm background:jobs` → template/FFmpeg worker | Manual pipeline parameter | Persisted queue, deterministic renderer, Supabase Storage, protected CircleCI variables. |
| Social publishing queue | CircleCI `background-jobs` → `pnpm background:jobs` → social publisher | Manual pipeline parameter | Queue claims, idempotency keys, provider credentials server-side, bounded retries and platform result tracking. |
| Quran audio import | CircleCI `quran-audio-import` → canonical importer | Manual pipeline parameter | Storage quota gate, service-role secret, bounded concurrency, no GitHub runner. |
| Repository verification | CircleCI `ci-check` + Vercel build gate | Source changes / every deployment | `pnpm verify` is the canonical validation command. |
| Production smoke | CircleCI `production-smoke` | Manual pipeline parameter | Public HTTP checks only. |
| Security audit | CircleCI `security-audit` | Manual pipeline parameter | No production publishing credentials required. |

## Scheduler ownership

The Supabase migration `20260915004110_retire_vercel_video_processing_cron.sql` retires the legacy `zikr-video-processing` cron job. The old Vercel route must not become an alternate scheduler.

GitHub Actions are retired from the active repository. Do not recreate `.github/workflows/`.

Supabase owns minute-level prayer scheduling. CircleCI is used as an external CI/recovery execution environment and does not become an automatic production scheduler unless explicitly configured through a deliberate CircleCI scheduled pipeline.

## Prayer Web Push lifecycle

A signed-in user selects a location on `/prayer-times` and explicitly enables background prayer alerts in `/settings`. The browser registers its Push API subscription only after notification permission is granted. The authenticated API persists the device subscription, location, and enabled-prayer preferences while enforcing ownership on the server.

The minute worker uses protected server-side VAPID configuration. Private scheduler credentials and VAPID private material are never returned to the browser or committed to the repository.

Each delivery uses a unique subscription/prayer/time key and is claimed before sending. Stale claims are recoverable and transient provider failures use bounded retry behavior.

## Video and social lifecycle

```text
video_generation_requests
        │
        ▼
CircleCI background-jobs (manual parameter)
        │
        ├── seed queue items
        ├── FFmpeg template renderer
        ├── Supabase Storage
        └── social_publish_queue
                    │
                    ├── YouTube OAuth upload
                    └── Facebook / Reels publish
```

Production video generation uses the deterministic FFmpeg template renderer. HeyGen fields/migrations remain only for historical compatibility and must not become an alternate production execution path.

The worker requires a direct HTTPS media URL for social publication and rejects YouTube watch URLs as media sources. Social queue items record platform-level success/failure and retry only unfinished platforms.

## Manual CircleCI operations

The CircleCI configuration is parameterized so operational jobs are **opt-in** and do not run on every source change.

Pipeline parameters:

- `run_background_jobs=true` with `background_target=all|videos|social`
- `run_quran_audio_import=true`
- `run_production_smoke=true`
- `run_security_audit=true`

These parameters are submitted through the CircleCI pipeline trigger/API. The ordinary source-change workflow runs only `ci-check`; Android release work remains restricted to release branches/tags.

## Safety

Production credentials belong only in protected CircleCI project/context variables, Supabase secrets, or Vercel secrets as appropriate. Never commit `SUPABASE_SERVICE_ROLE_KEY`, provider access tokens, OAuth refresh tokens, Android signing keys, or scheduler secrets.

Do not create a second scheduler to compensate for a temporary provider outage. Inspect the queue state and error metadata, then execute the appropriate CircleCI recovery pipeline once.

## Supabase Preview integration

Supabase Preview/automatic branching is separate from production scheduling. Do not reset production migration history or mark unseen versions as applied merely to make a preview branch match production. Historical migrations remain part of the canonical repository chain.
