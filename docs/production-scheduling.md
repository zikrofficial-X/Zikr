# ZIKR Production Scheduling

ZIKR has one authoritative execution owner per production workload. Quran audio is intentionally externalized and is **not** imported into Supabase Storage.

| Workload | Authoritative execution owner | Cadence | Safety boundary |
|---|---|---:|---|
| Prayer Web Push planning and delivery | Supabase `pg_cron` → `prayer-notification-worker` | Every minute | Private scheduler token, per-device uniqueness, atomic claims, bounded retries, invalid-subscription deactivation. |
| Client-local azan and reminder sounds | Browser / native client | While active | Local/offline fallback; it does not create server delivery rows. |
| Video generation queue | GitHub Actions `generate-ai-video.yml` → `pnpm background:jobs` → template/FFmpeg/AI worker | Four times daily + manual dispatch | Persisted Supabase queue; generated MP4s upload directly from the worker to Cloudinary; no Supabase video staging or CircleCI execution. |
| Admin Run Now dispatcher | Admin server action → GitHub Actions `generate-ai-video.yml` dispatch | On demand | Direct dispatch with protected token; request is marked dispatched only after GitHub returns 204. |
| Social publishing queue | GitHub Actions `publish-social.yml` → `pnpm background:jobs` → social publisher | After successful generation + manual dispatch + bounded 15-minute retry drain | Only post-activation rows, provider preflight, source-locked five-part automated QA, idempotent claims, per-platform retries, and platform result tracking. |
| Social insights | GitHub Actions `sync-social-insights.yml` → `BACKGROUND_JOB_TARGET=insights` | Daily + manual dispatch | Separate read/analytics worker; external publishing is explicitly disabled. |
| Quran text/catalog | Local canonical corpus → Supabase fallback | Request time | 114 surahs / 6,236 ayahs are verified; Supabase remains compatibility data. |
| Quran audio playback | External HTTPS audio URLs via `quran_audio.audio_url` | On demand | No Supabase Storage dependency; no bulk MP3 import job is permitted. |
| Repository verification | GitHub Actions `ZIKR Quality Gate` | Pull requests and `main` | `pnpm verify:pr` on PRs; full `pnpm verify` (including mobile, SEO, lint, types, and production build) on `main`. |
| Production smoke | GitHub Actions `ZIKR Production Release` | Manual post-deploy verification | Public HTTP checks for home, robots, and sitemap. |
| Public offline-content snapshot | GitHub Actions `refresh-offline-content.yml` | Daily + manual dispatch | One validated public-data export per day; ordinary Vercel builds use the committed snapshot and do not bulk-read Supabase. |
| Security audit | CircleCI `security-audit` | Manual pipeline parameter | No production publishing credentials required. |

## Scheduler ownership

The Supabase migration `20260915004110_retire_vercel_video_processing_cron.sql` retires the legacy `zikr-video-processing` cron job. The old Vercel route has been deleted and must not be recreated as an alternate scheduler.

Supabase owns minute-level prayer scheduling.
GitHub Actions is the authoritative automatic video generation worker.
GitHub Actions is the authoritative automatic social publisher. Video generation runs four times per day; the separate social publisher starts after a successful video-generation workflow, on explicit manual dispatch, and on a bounded 15-minute poll to retry eligible deferred or partial rows. New queue items are restricted by `SOCIAL_PUBLISH_AFTER`; historical rows remain excluded until an audited cleanup window is approved. New videos publish automatically only after the versioned five-part source/audio/visual/caption/rights QA record passes and matches the exact source, content, template and MP4 fingerprint; the worker revalidates it immediately before every provider call. No manual video review is required. Admin Run Now dispatches the canonical GitHub video workflow directly. CircleCI is reserved for the application build/documentation artifact, Android release builds, Supabase release gates, English content sync, and explicit recovery/release operations.

## Quran audio architecture

The Free-plan architecture deliberately stores **zero Quran MP3 binaries** in Supabase Storage. The `quran_audio` table retains validated external HTTPS URLs. The application rejects old Supabase Storage URLs and can derive a verified external URL from the reciter catalog when needed.

The repository no longer contains an operational CircleCI job for importing Quran audio into Storage. This is intentional and protects the Free Storage quota.

## Prayer Web Push lifecycle

A signed-in user selects a location on `/prayer-times` and explicitly enables background prayer alerts in `/settings`. The browser registers its Push API subscription only after notification permission is granted. The authenticated API persists the device subscription, location, and enabled-prayer preferences while enforcing ownership on the server.

The minute worker uses protected server-side VAPID configuration. Private scheduler credentials and VAPID private material are never returned to the browser or committed to the repository.

Each delivery uses a unique subscription/prayer/time key and is claimed before sending. Stale claims are recoverable and transient provider failures use bounded retry behavior.

## Video and social lifecycle

```
GitHub Actions: generate-ai-video.yml
        │
        ├── seed queue items
        ├── AI providers / FFmpeg renderer
        ├── Arabic TTS or verified Quran recitation
        ├── video QA
        └── Supabase Storage
                    │
                    ▼
            social_publish_queue
                    │
                    ▼
GitHub Actions: publish-social.yml
        │
        ├── YouTube OAuth upload
        └── Facebook / Reels publish
```

Production video generation uses the deterministic FFmpeg template renderer. Quran videos use the verified external recitation URL from the Quran catalog. All other source-locked videos receive Arabic narration from the free `edge-tts` worker helper when no source recording exists; silent output is not allowed. HeyGen fields/migrations remain only for historical compatibility and must not become an alternate production execution path.

The worker requires a direct HTTPS media URL for social publication and rejects YouTube watch URLs as media sources. Social queue items record platform-level success/failure and retry only unfinished platforms.

## Manual CircleCI operations

CircleCI is now the application-build and release-artifact lane. Production video generation and social publishing are intentionally absent from CircleCI.

Pipeline parameters:

- `run_circleci_ci=true` for the application build/documentation lane;
- `run_security_audit=true` for the manual security audit;

There is intentionally **no `run_quran_audio_import` parameter**. Quran audio is externalized and must not be bulk-uploaded to Supabase Storage.

Recurring schedules are declared in GitHub Actions: video generation at 03:17, 09:17, 15:17, and 21:17 UTC; social publishing every 15 minutes. CircleCI retains the English content schedule at 04:17 UTC and handles application/Android build artifacts. Routine source-change verification belongs to GitHub Actions.

## Safety

Production credentials belong only in the protected GitHub production environment for video/social automation, CircleCI project/context variables for app/Android builds, Supabase secrets, or Vercel secrets as appropriate. Never commit `SUPABASE_SERVICE_ROLE_KEY`, provider access tokens, OAuth refresh tokens, Android signing keys, or scheduler secrets.

Do not create a second scheduler to compensate for a temporary provider outage. Inspect the queue state and error metadata, then use the GitHub Actions manual dispatch for video generation or social publishing.

## Supabase Preview integration

Supabase Preview/automatic branching is separate from production scheduling. Do not reset production migration history or mark unseen versions as applied merely to make a preview branch match production. Historical migrations remain part of the canonical repository chain.
