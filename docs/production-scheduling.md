# ZIKR Production Scheduling

ZIKR has one authoritative execution owner per production workload.

| Workload | Authoritative execution owner | Cadence | Safety boundary |
|---|---|---:|---|
| Prayer Web Push planning and delivery | Supabase `pg_cron` → `prayer-notification-worker` | Every minute | Private scheduler token, per-device uniqueness, atomic claims, bounded retries, invalid-subscription deactivation. |
| Client-local azan and reminder sounds | Browser / native client | While active | Local/offline fallback; it does not create server delivery rows. |
| Video generation queue | GitHub Actions → `generate-ai-video.yml` → `pnpm background:jobs` | Every 2 hours | Persisted queue, source-locked content, deterministic FFmpeg renderer, Supabase Storage, GitHub secret isolation. |
| Social publishing queue | GitHub Actions → same worker | Every 2 hours / after successful renders | Idempotent queue, provider credentials server-side, bounded retries and per-platform result tracking. |
| Quran audio import | CircleCI `quran-audio-import` | Manual pipeline parameter | Storage quota gate, service-role secret, bounded concurrency. |
| Repository verification | CircleCI `ci-check` + Vercel build gate | Source changes / every deployment | `pnpm verify` is the canonical validation command. |
| Security audit | CircleCI `security-audit` | Manual pipeline parameter | No production publishing credentials required. |

## Scheduler ownership

The Supabase migration `20260915004110_retire_vercel_video_processing_cron.sql` retires the legacy `zikr-video-processing` cron job. The old Vercel route must not become an alternate scheduler.

The active video/social scheduler is GitHub Actions. Do not create a Vercel Cron, Supabase video cron, or recurring CircleCI schedule for the same queues.

Supabase owns minute-level prayer scheduling. CircleCI is a verification/recovery environment and remains manual for background recovery.

## Video and social lifecycle

```text
GitHub Actions (every 2 hours)
        │
        ├── seedAutomatedVideoRequests()
        │      ├── Quran source-locked jobs
        │      ├── Hadith source-locked jobs
        │      └── Dua source-locked jobs
        │
        ▼
video_generation_requests
        │
        ▼
free FFmpeg template renderer
        │
        ├── exact source text
        └── bounded Gemini reflection (when GEMINI_API_KEY exists)
        │
        ▼
Supabase Storage /videos/automated/*
        │
        ▼
social_publish_queue
        │
        ├── YouTube
        └── Facebook / Reels
```

The queue is idempotent by `automation_key`. Normal operation does not require opening the admin page.

## Manual recovery

CircleCI can run:

- `run_background_jobs=true` with `background_target=all|videos|social`
- `run_quran_audio_import=true`
- `run_security_audit=true`

These are recovery/maintenance operations, not normal scheduling.

## Safety

Production credentials belong only in protected GitHub Actions, CircleCI, Supabase, or Vercel secret stores as appropriate. Never commit service-role keys, provider access tokens, OAuth refresh tokens, signing keys, or scheduler secrets.

Do not create a second scheduler to compensate for a temporary outage. Inspect queue state and error metadata, then use the dedicated recovery path once.

## Supabase Preview

Supabase Preview/automatic branching is separate from production scheduling. Never reset production migration history or invent a migration filename just to satisfy a preview branch. Keep the local migration ledger byte-for-byte aligned by version with production history.
