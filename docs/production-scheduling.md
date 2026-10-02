# ZIKR Production Scheduling

ZIKR has one authoritative execution owner per production workload. Quran audio is intentionally externalized and is **not** imported into Supabase Storage.

| Workload | Authoritative execution owner | Cadence | Safety boundary |
|---|---|---:|---|
| Prayer Web Push planning and delivery | Supabase `pg_cron` → `prayer-notification-worker` | Every minute | Private scheduler token, per-device uniqueness, atomic claims, bounded retries, invalid-subscription deactivation. |
| Client-local azan and reminder sounds | Browser / native client | While active | Local/offline fallback; it does not create server delivery rows. |
| Video generation queue | GitHub Actions `ZIKR Autonomous AI Video Worker` → `pnpm background:jobs` → template/FFmpeg worker | Every 2 hours + manual dispatch | Persisted queue, deterministic renderer, protected GitHub secrets, bounded work. |
| Social publishing queue | CircleCI `background-jobs` → `pnpm background:jobs` → social publisher | Manual pipeline parameter | Queue claims, idempotency keys, provider credentials server-side, bounded retries and platform result tracking. |
| Quran text/catalog | Local canonical corpus → Supabase fallback | Request time | 114 surahs / 6,236 ayahs are verified; Supabase remains compatibility data. |
| Quran audio playback | External HTTPS audio URLs via `quran_audio.audio_url` | On demand | No Supabase Storage dependency; no bulk MP3 import job is permitted. |
| Repository verification | CircleCI `ci-check` + Vercel build gate | Source changes / every deployment | `pnpm verify` is the canonical validation command. |
| Production smoke | CircleCI `production-smoke` | Manual pipeline parameter | Public HTTP checks only. |
| Security audit | CircleCI `security-audit` | Manual pipeline parameter | No production publishing credentials required. |

## Scheduler ownership

The Supabase migration `20260915004110_retire_vercel_video_processing_cron.sql` retires the legacy `zikr-video-processing` cron job. The old Vercel route must not become an alternate scheduler.

GitHub Actions are not the active scheduler in the current repository. Do not recreate `.github/workflows/` as a recurring scheduler unless the architecture is deliberately changed and documented.

Supabase owns minute-level prayer scheduling. GitHub Actions is the authoritative automatic video/social worker. CircleCI remains a manual CI/recovery environment and must not become a second automatic video scheduler.

## Quran audio architecture

The Free-plan architecture deliberately stores **zero Quran MP3 binaries** in Supabase Storage. The `quran_audio` table retains validated external HTTPS URLs. The application rejects old Supabase Storage URLs and can derive a verified external URL from the reciter catalog when needed.

The repository no longer contains an operational CircleCI job for importing Quran audio into Storage. This is intentional and protects the Free Storage quota.

## Prayer Web Push lifecycle

A signed-in user selects a location on `/prayer-times` and explicitly enables background prayer alerts in `/settings`. The browser registers its Push API subscription only after notification permission is granted. The authenticated API persists the device subscription, location, and enabled-prayer preferences while enforcing ownership on the server.

The minute worker uses protected server-side VAPID configuration. Private scheduler credentials and VAPID private material are never returned to the browser or committed to the repository.

Each delivery uses a unique subscription/prayer/time key and is claimed before sending. Stale claims are recoverable and transient provider failures use bounded retry behavior.

## Video and social lifecycle

```
video_generation_requests
        │
        ▼
GitHub Actions scheduled worker
        │
        ├── seed queue items
        ├── FFmpeg template renderer
        ├── Supabase Storage
        └── social_publish_queue
                    │
                    ├── YouTube OAuth upload
                    └── Facebook / Reels publish
```

Production video generation uses the deterministic FFmpeg template renderer. Quran videos use the verified external recitation URL from the Quran catalog. All other source-locked videos receive Arabic narration from the free `edge-tts` worker helper when no source recording exists; silent output is not allowed. HeyGen fields/migrations remain only for historical compatibility and must not become an alternate production execution path.

The worker requires a direct HTTPS media URL for social publication and rejects YouTube watch URLs as media sources. Social queue items record platform-level success/failure and retry only unfinished platforms.

## Manual CircleCI operations

The CircleCI configuration is parameterized so operational jobs are **opt-in** and do not run on every source change.

Pipeline parameters:

- `run_background_jobs=true` with `background_target=all|videos|social`
- `run_production_smoke=true`
- `run_security_audit=true`

There is intentionally **no `run_quran_audio_import` parameter**. Quran audio is externalized and must not be bulk-uploaded to Supabase Storage.

These parameters are submitted through the CircleCI pipeline trigger/API. The ordinary source-change workflow runs only `ci-check`; Android release work remains restricted to release branches/tags.

## Safety

Production credentials belong only in protected CircleCI project/context variables, Supabase secrets, or Vercel secrets as appropriate. Never commit `SUPABASE_SERVICE_ROLE_KEY`, provider access tokens, OAuth refresh tokens, Android signing keys, or scheduler secrets.

Do not create a second scheduler to compensate for a temporary provider outage. Inspect the queue state and error metadata, then execute the appropriate CircleCI recovery pipeline once.

## Supabase Preview integration

Supabase Preview/automatic branching is separate from production scheduling. Do not reset production migration history or mark unseen versions as applied merely to make a preview branch match production. Historical migrations remain part of the canonical repository chain.
