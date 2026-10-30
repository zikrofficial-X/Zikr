# ZIKR Finalization — Phase 2 Current Architecture Map

Date: 2026-10-30
Audited source: GitHub `main` at `57e9767cf4a1980e9d947ee4a8f5982b46aa42a9`.

## Canonical runtime boundaries

### A. Next.js request/runtime
- `src/app/**/page.tsx`, `layout.tsx`, `route.ts`
- `proxy.ts`
- Route entrypoints render UI, parse requests, authenticate, serialize responses and delegate to feature services.

### B. Domain feature layer
- `src/features/*` owns domain services, UI, data contracts and adapters.
- Current domains include Quran, Hadith, Dua, Adhkar, Stories, Prophets, Companions, Scholars, Articles, Videos, Audio, Social, Kids, Prayer, Qibla, Notifications, Memorization, Spiritual AI, Search, Admin, Releases, Offline, Site Content and Content Library.

### C. Shared infrastructure
- `src/lib/supabase/*`, `src/lib/env.ts`, `src/lib/site.ts`, HTTP/security/cache/offline/navigation/SEO helpers.
- `src/components/ui/*` and `src/components/layout/*` are shared presentation.
- Domain exceptions still present: 23 files under `src/lib/games/*`, 3 under `src/lib/audio/*`, and `src/lib/types/video.ts`.

### D. Data/platform layer
- `supabase/migrations/` is the canonical schema history.
- Supabase PostgreSQL/RLS, Storage, Auth, and `supabase/functions/*`.
- `src/lib/supabase/server.ts`, client and admin REST adapters own platform access.

### E. Background execution
- GitHub Actions schedules video generation and social publishing.
- `scripts/run-background-jobs.ts` is the worker entrypoint.
- `scripts/jobs/template-video-automation.ts` owns video queue seeding, source selection, rendering, AI planning and reconciliation.
- `scripts/jobs/social-publishing.ts` owns per-platform publishing.
- Prayer notifications remain separate: Supabase pg_cron -> `prayer-notification-worker` Edge Function -> Web Push.
- No duplicate scheduler was introduced.

### F. Provider/external adapters
- Video provider router and provider contracts live under `src/features/videos/providers/*`.
- Other integrations include Supabase, Gemini, Hugging Face, Edge TTS, YouTube, Facebook Graph API, Google OAuth, AlAdhan, Cloudinary, geocoding, analytics/ads and Vercel.

### G. Native/mobile boundary
- Android/iOS Capacitor shells consume the canonical web runtime and native bridge.
- Domain business logic remains in the web/feature layer; native code should not fork it.

## Verified dependency paths

### Kids result submission
```
Deprecated API route
  -> public token validation
  -> recordKidsGameResultForUser()
  -> kids persistence/progression service
  -> Supabase
```
The old route is now a thin compatibility adapter, no longer contains `@ts-nocheck`, and its unauthenticated health probe is removed. This resolves the primary Phase 2 kids API boundary violation.

### Public search
```
Search API/page
  -> global search service
  -> Quran local corpus + indexed Supabase FTS services
  -> normalized Arabic search vector / GIN indexes
```
The current PR corrects PostgREST configured FTS syntax and retains local long-form editorial matches.

### Video pipeline
```
GitHub Actions schedule
  -> run-background-jobs.ts
  -> durable video_generation_requests
  -> template-video-automation worker
  -> provider router / renderer
  -> Supabase Storage
  -> social_publish_queue
  -> dedicated social publisher
  -> YouTube / Facebook
  -> video_automation_runs telemetry
```
The durable queues are authoritative. Phase 0 now disables automatic AI visual generation and publishing; template rendering remains available.

## Remaining Phase 2 refactor targets

| Priority | Target | Current evidence | State |
|---|---|---|---|
| P0 | Kids result/progression logic out of API route | Route delegates to feature service; no ts-nocheck | COMPLETE |
| P0 | One video job state machine | Durable queues and contracts exist; worker remains a 1,536-line orchestrator | PARTIAL |
| P0 | Separate scheduler/worker/publisher | Separate GitHub workflows and social worker exist; video worker still seeds and executes | PARTIAL |
| P1 | Move `src/lib/games/*` to Kids feature ownership | 23 files remain | OPEN |
| P1 | Move `src/lib/audio/*` to Audio feature ownership | 3 files remain | OPEN |
| P1 | Move `src/lib/types/video.ts` to Videos feature types | File remains | OPEN |
| P1 | Remove hardcoded production URL from video worker | Worker still contains a hardcoded site URL helper | OPEN |
| P1 | Consolidate route-local admin actions | Eight route-local action files remain; inspect each for thin-adapter vs business-logic ownership | OPEN |
| P2 | Normalize feature-to-feature imports | Requires import graph review | OPEN |
| P2 | Update older architecture/release docs | This current map supersedes stale 2026-10-02 counts | OPEN |

## Target dependency rules
1. Pages/layouts may import feature UI/services and shared infrastructure, but do not own domain persistence logic.
2. API routes are thin transport adapters; auth, validation, business rules and persistence belong in feature services/actions.
3. Domain code must not be added under `src/lib`.
4. Shared infrastructure must not depend on domain features.
5. Feature-to-feature access uses explicit public service contracts.
6. Provider adapters implement feature-owned interfaces and contain no page/UI logic.
7. Workers operate on durable jobs; schedulers activate work; publishers publish it.
8. Supabase service-role access remains server/worker/Edge Function only.
9. Native code uses product contracts and platform bridges, not duplicated domain logic.
10. Canonical configuration is not duplicated as hardcoded constants.

Phase 2 is partially complete: the main kids API violation is resolved, but shared-domain placement, worker decomposition and URL centralization remain open.
