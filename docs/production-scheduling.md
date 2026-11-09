# ZIKR Production Scheduling

ZIKR has one authoritative execution owner per production workload. Quran audio is intentionally externalized and is **not** imported into Supabase Storage.

| Workload | Authoritative execution owner | Cadence | Safety boundary |
|---|---|---:|---|
| Prayer Web Push planning and delivery | Supabase `pg_cron` → `prayer-notification-worker` | Every minute | Private scheduler token, per-device uniqueness, atomic claims, bounded retries, invalid-subscription deactivation. |
| Client-local azan and reminder sounds | Browser / native client | While active | Local/offline fallback; it does not create server delivery rows. |
| Video generation queue | GitHub Actions `generate-ai-video.yml` → `pnpm background:jobs` → template/FFmpeg/AI worker | Four times daily + manual dispatch | Persisted Supabase queue; generated MP4s upload directly from the worker to Cloudinary; no Supabase video staging or CircleCI execution. |
| Admin Run Now dispatcher | Admin server action → GitHub Actions `generate-ai-video.yml` dispatch | On demand | Direct dispatch with protected token; request is marked dispatched only after GitHub returns 204. |
| Internal video publication | Video worker → `videos` → `content_publish_queue` → `scripts/jobs/content-publishing.ts` | After each QA-approved generation | Source-locked automated QA must pass; generated video is served only inside ZIKR. |
| External social publishing | Retired; inert `publish-social.yml` sentinel | None | Admin social API returns HTTP 410; no schedule, workflow-run trigger, provider credentials, or background publisher. Historical records are preserved and not processed. |
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
External social publishing is retired. Its API returns HTTP 410, the workflow has no automatic triggers and an inert manual-dispatch job, and the background runner never claims or reconciles historical social queue rows. Existing records are retained. Video generation runs four times per day; videos enter ZIKR's internal site queue only after the versioned source/audio/visual/caption/rights QA record passes and matches the exact source, content, template and MP4 fingerprint. Admin Run Now dispatches the canonical GitHub video workflow directly. CircleCI is reserved for the application build/documentation artifact, Android release builds, Supabase release gates, English content sync, and explicit recovery/release operations.

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
        ├── source-locked video QA
        └── register approved video in the internal `videos` catalog
                    │
                    ▼
            content_publish_queue (`content_table=videos`)
                    │
                    ▼
            ZIKR site publisher (`/videos`)
```

Production video generation uses the deterministic FFmpeg template renderer. Quran videos use the verified external recitation URL from the Quran catalog. All other source-locked videos receive Arabic narration from the free `edge-tts` worker helper when no source recording exists; silent output is not allowed. HeyGen fields/migrations remain only for historical compatibility and must not become an alternate production execution path. Generated videos are published on the ZIKR site only; provider credentials and external distribution are not used by the worker.

The internal publisher validates the generated video record and uses the site's own content queue. Historical social queue rows are not claimed, mutated, reconciled, or delivered.

## Manual CircleCI operations

CircleCI is now the application-build and release-artifact lane. Production video generation and social publishing are intentionally absent from CircleCI.

Pipeline parameters:

- `run_circleci_ci=true` for the application build/documentation lane;
- `run_security_audit=true` for the manual security audit;

There is intentionally **no `run_quran_audio_import` parameter**. Quran audio is externalized and must not be bulk-uploaded to Supabase Storage.

Recurring schedules are declared in GitHub Actions: internal video generation at 03:17, 09:17, 15:17, and 21:17 UTC. External social publishing has no schedule. CircleCI retains the English content schedule at 04:17 UTC and handles application/Android build artifacts. Routine source-change verification belongs to GitHub Actions.

## Safety

Production credentials belong only in the protected GitHub production environment for internal video/site automation, CircleCI project/context variables for app/Android builds, Supabase secrets, or Vercel secrets as appropriate. Never commit `SUPABASE_SERVICE_ROLE_KEY`, provider access tokens, OAuth refresh tokens, Android signing keys, or scheduler secrets.

Do not create a second scheduler to compensate for an outage. Inspect the internal queue state and error metadata, then use the GitHub Actions manual dispatch for video generation. Social publishing must not be re-enabled through a manual dispatch.

## Supabase Preview integration

Supabase Preview/automatic branching is separate from production scheduling. Do not reset production migration history or mark unseen versions as applied merely to make a preview branch match production. Historical migrations remain part of the canonical repository chain.
