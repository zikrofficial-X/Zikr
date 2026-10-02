# ZIKR Finalization — Phase 2 Architecture Map

Date: 2026-10-02
Repository: zikr-org/Zikr
Baseline main commit: e1b84fac78d1ddb1fb971f7ec456b5ae37936edf
Working branch: audit/phase-0-1-finalization

## 1. Scope

Phase 2 maps the current runtime architecture from routes and UI entrypoints through feature modules, shared infrastructure, APIs, workers/jobs, database access, provider adapters, external integrations, and native/mobile boundaries.

This document is an architecture baseline. It records observed dependencies and the target dependency rules for the later refactor phases. It does not claim that the target architecture already exists.

## 2. Repository shape

Current main contains 1,148 tracked files:

| Area | Count | Architectural role |
| --- | ---: | --- |
| src | 527 | Next.js routes, UI, features, services, shared infrastructure |
| src/app route/page/API entries | 173 | Runtime entrypoints |
| src/features | 174 | Domain feature modules |
| src/lib | 47 | Cross-cutting infrastructure plus some misplaced domain code |
| src/app/admin | 43 | Administrative entrypoints |
| src/app/api | 63 | HTTP/API entrypoints |
| scripts | 40 | Verification, maintenance, workers, imports |
| supabase/migrations | 291 | Canonical DB migration chain |
| supabase/functions | 9 | DB-adjacent Edge Functions |
| android | 56 | Capacitor Android shell |
| ios | 19 | Capacitor iOS shell |
| public | 59 | Static/PWA/offline/media assets |
| docs | 49 | Operational and historical documentation |

The architecture is therefore already modular at the directory level, but its dependency direction is not consistently enforced at file level.

## 3. Current runtime boundaries

### Boundary A — Next.js request/runtime

Primary entrypoints:
- `src/app/**/page.tsx`
- `src/app/**/layout.tsx`
- `src/app/**/route.ts`
- `proxy.ts`
- Server actions under `src/app` and `src/features`

Responsibilities observed:
- route rendering and metadata
- request parsing
- authentication redirects
- API response serialization
- calling feature services
- some direct database/business logic

The last responsibility is the main boundary leak to remove.

### Boundary B — Feature/domain layer

Primary location:
- `src/features/*`

Representative domains:
- quran
- hadith
- dua
- adhkar
- stories
- prophets
- companions
- scholars
- battles
- conquests
- articles
- videos
- audio
- social
- kids
- prayer
- qibla
- notifications
- memorization
- spiritual-ai
- search
- admin
- releases
- offline
- site-content
- content-library

Feature modules already contain services/components/data/types/integrations in many areas. This is the canonical domain ownership layer.

### Boundary C — Shared infrastructure

Primary location:
- `src/lib/*`
- `src/components/ui/*`
- `src/components/layout/*`

Legitimate cross-cutting responsibilities include:
- Supabase clients
- environment resolution
- HTTP helpers
- storage helpers
- auth/session plumbing
- security primitives
- offline persistence
- navigation catalog
- SEO
- generic health/observability

Architectural exception candidates were found under `src/lib/games/*`, `src/lib/audio/*`, and `src/lib/types/video.ts`. These are domain-specific and should move behind their owning features during cleanup rather than remain in shared infrastructure.

### Boundary D — Data/platform layer

Primary sources:
- `supabase/migrations/`
- Supabase PostgreSQL + RLS
- Supabase Storage
- Supabase Auth
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/admin-rest.ts`
- `supabase/functions/*`

This boundary owns persistence and server-side platform services. It must not become the location for UI behavior or feature semantics.

### Boundary E — Background execution

Primary locations:
- `scripts/run-background-jobs.ts`
- `scripts/jobs/template-video-automation.ts`
- `scripts/jobs/social-publishing.ts`
- `.github/workflows/generate-ai-video.yml`
- `supabase/functions/prayer-notification-worker/*`
- additional Supabase Edge Functions

The video worker currently owns both queue production and execution, while GitHub Actions schedules the worker. Social publication is also executed by the same background-runner process. This is workable but too coupled for the final architecture.

### Boundary F — Provider/external integration layer

Video providers:
- `src/features/videos/providers/provider-router.ts`
- `src/features/videos/providers/types.ts`
- `comfyui-provider.ts`
- `free-api-provider.ts`
- `hf-space-provider.ts`
- `template-provider.ts`

Other external integration families include:
- Supabase
- Gemini
- Hugging Face Spaces
- ComfyUI
- Edge TTS runtime
- YouTube
- Facebook Graph API
- Google OAuth
- Quran/Hadith/Islamic content APIs
- AlAdhan
- Cloudinary
- geocoding
- analytics/ads
- Vercel deployment tooling

External integrations should be consumed through feature-owned adapters or cross-cutting platform adapters, not directly from page components.

## 4. Observed dependency graph

### Public content path

```
Next route/page
  -> feature component or feature service
  -> cross-cutting infrastructure when needed
  -> Supabase / local verified content / external read API
```

Representative verified examples:

```
/quran
  -> quran-catalog-page
  -> Quran feature data/services

/quran/[surah]
  -> quran-server
  -> Supabase + verified fallback

/quran/audio API
  -> quran-server

/articles/[slug]
  -> articles service
  -> content-quality + site infrastructure

/videos
  -> videos YouTube integration
  -> verified/fallback video data

/prayer-times
  -> prayer feature component
  -> prayer feature service/hook
```

This direction is the desired pattern.

### Admin path

Current pattern:

```
Admin page
  -> admin service
  -> Supabase
```

but several route-local action/API entrypoints still contain business logic or direct database access.

Target:

```
Admin page
  -> admin feature action/service
  -> domain feature service
  -> repository/platform adapter
  -> Supabase
```

The admin UI must never become the canonical owner of domain logic.

### Kids path

Current healthy part:

```
/kids/games
  -> games-index
  -> unified game runtime
  -> lib/games/*
```

Current boundary violation:

```
/api/kids/games/submit-result
  -> direct @supabase/supabase-js service-role client
  -> kids_game_results
  -> kids_game_progress
  -> kids_achievements
```

This route contains authentication, persistence, progression and achievement business rules itself and is also marked `@ts-nocheck`.

Target:

```
API route
  -> kids service
  -> validated game result contract
  -> server persistence
  -> progression/achievement service
```

The business rules should be reusable by web, offline sync and future native entrypoints.

### Video generation path

Current path:

```
GitHub Actions schedule
  -> scripts/run-background-jobs.ts
  -> seedAutomatedVideoRequests()
  -> video_generation_requests
  -> processTemplateVideoQueue()
  -> video provider router
       -> hf_ltx_fast
       -> hf_wan
       -> comfyui
       -> free_api
       -> template fallback
  -> FFmpeg / Edge TTS / source assets
  -> Supabase Storage
  -> social_publish_queue
  -> social publisher
  -> YouTube / Facebook
  -> video_automation_runs telemetry
```

There is also a Next.js surface around the same queue:
- `src/features/videos/services/video-automation.ts`
- `src/app/api/admin/video-generation/*`
- `src/app/api/admin/videos/*`
- `src/app/api/internal/video-generation/daily/*`
- `src/app/api/internal/video-processing/*`

The final architecture should keep the durable queue as the source of truth while moving scheduling, execution, publication, and API concerns into explicit contracts.

### Prayer notification path

```
User location/preferences
  -> prayer feature services
  -> persisted prayer schedule/notification state
  -> Supabase pg_cron
  -> prayer-notification-worker Edge Function
  -> Web Push
```

This is a separate scheduler/worker system and should remain isolated from the video worker.

### Mobile path

```
Android/iOS native shell
  -> Capacitor web runtime
  -> canonical ZIKR web deployment
  -> native bridge for notifications/filesystem/network/haptics/etc.
```

The web application remains the primary product runtime. Native code should provide platform capabilities rather than duplicate domain implementations.

## 5. High-risk boundary violations found

### A. Direct database/business logic in API routes

Confirmed example:
`src/app/api/kids/games/submit-result/route.ts`

It:
- creates its own service-role Supabase client
- validates bearer auth locally
- writes game results
- upserts progress
- calculates achievements
- writes achievements
- exposes a DB health check

This is a domain service hidden inside an API route and is a Phase 2 refactor target.

### B. Domain logic under `src/lib`

Confirmed candidates:
- `src/lib/games/*`
- `src/lib/audio/*`
- `src/lib/types/video.ts`

These are not generic infrastructure. They belong under `features/kids`, `features/audio`, and `features/videos` respectively.

### C. Route-local admin actions

Existing examples include:
- `src/app/admin/content-actions.ts`
- `src/app/admin/editorial-actions.ts`
- `src/app/admin/android/actions.ts`
- `src/app/admin/knowledge/actions.ts`
- `src/app/admin/kids/actions.ts`
- `src/app/admin/system-actions.ts`

Some route-local actions are acceptable when they are thin adapters. Business logic should be moved to feature services/actions where it is reusable and auditable.

### D. Worker/service responsibility overlap

`src/features/videos/services/video-automation.ts` owns queue CRUD and platform publishing helpers, while `scripts/jobs/template-video-automation.ts` owns seeding, source selection, rendering, AI planning, queue processing and reconciliation.

This is an implicit orchestration contract rather than an explicit state machine.

### E. Scheduler/worker coupling

`.github/workflows/generate-ai-video.yml` is the scheduler, but the worker process itself decides:
- what to seed
- how many items to process
- which providers to use
- when to reconcile social jobs
- when to publish

Target separation is:

```
Scheduler -> due schedule records
Queue -> durable work items
Worker -> execution only
Publisher -> per-platform jobs
Telemetry -> immutable operational record
```

### F. Hardcoded runtime identity inside worker code

`scripts/jobs/template-video-automation.ts` contains its own `siteUrl()` returning the canonical production URL, while canonical site configuration already exists under `src/lib/site.ts` / env resolution.

This creates an avoidable configuration fork.

### G. Critical TypeScript bypass

`src/app/api/kids/games/submit-result/route.ts` and three game support files currently use `@ts-nocheck`.

The bypass should not remain on a canonical gameplay/progression boundary.

### H. Documentation/architecture drift

`docs/ARCHITECTURE.md` describes a `src/config/` directory, but the current repository root does not contain that directory.

The same document describes CircleCI as the canonical verification/release owner, while the current GitHub workflows now execute the repository quality gate and manual Vercel production release.

The document must be updated only after the final ownership model is implemented, but this drift is recorded now so future phases do not use it as an incorrect dependency map.

### I. CI boundary mismatch

The pull-request and production-release workflows execute `pnpm verify:pr`, while the full `pnpm verify` suite is heavier and includes additional checks/build.

This is not automatically a defect, but it is a release-policy gap that Phase 28 must explicitly resolve.

## 6. Current canonical ownership map

| Concern | Canonical owner |
| --- | --- |
| Route/page/layout | `src/app` |
| Domain business logic | `src/features/<domain>` |
| Shared UI | `src/components/ui` |
| Shared application shell | `src/components/layout` |
| Auth/session plumbing | `src/lib/supabase/*` + auth feature |
| Environment/config resolution | `src/lib/env.ts` + canonical site config |
| Quran | `src/features/quran` |
| Kids | `src/features/kids` + current game runtime (migration required out of `src/lib/games`) |
| Video | `src/features/videos` + background worker |
| Social | `src/features/social` |
| Prayer | `src/features/prayer` + prayer Edge Function |
| Audio | `src/features/audio` + audio infrastructure (migration required out of `src/lib/audio`) |
| Admin | `src/features/admin` for logic, `src/app/admin` for UI entrypoints |
| Persistence | Supabase migrations/schema |
| Background video execution | `scripts/jobs/*` |
| Scheduled video trigger | GitHub Actions |
| Minute-level prayer scheduler | Supabase pg_cron |
| Native capability bridge | Capacitor/native project |
| Verification/release scripts | `scripts/*` |

## 7. Target dependency rules

The following rules become the architectural contract for Phases 3+:

1. A page/layout may import feature UI/services and shared infrastructure, but must not own non-trivial domain persistence logic.
2. An API route must be a thin transport adapter. Authentication, validation, business rules and persistence belong in feature services/actions.
3. Domain code must not be introduced into `src/lib`.
4. `src/lib` may depend on platform primitives and generic utilities, but should not depend on business-domain modules.
5. Feature modules may depend on shared infrastructure; feature A should not reach into feature B's internal files without an explicit public service contract.
6. Provider adapters must implement feature-level interfaces and must not contain page/UI logic.
7. Workers operate on durable jobs. They do not become a second source of truth for content.
8. Schedulers create/activate work; workers execute it; publishers publish it.
9. Supabase service-role access is server/worker/Edge-function only.
10. Native code consumes the web/product contracts and platform bridges; it must not fork domain logic.
11. Configuration values with a canonical owner are not duplicated as hardcoded constants in workers/routes.
12. Every durable state machine must have one authoritative type/state definition shared by API, worker and persistence contract.
13. Historical migrations remain historical; only `supabase/migrations/` is executable migration source.
14. New feature work must include a route -> service -> data dependency path that can be tested independently of the UI.

## 8. Target architecture

```
                        ZIKR
                         |
                +--------+--------+
                |                 |
             Web/App           Native shell
                |                 |
          Next.js App Router   Capacitor bridge
                |
        +-------+--------+
        |                |
     Route/UI         API/Actions
        |                |
        +-------+--------+
                |
        Domain Feature Layer
        |   |   |   |   |
      Quran Kids Video Audio Content ...
                |
        Domain Services
                |
        +-------+------------------+
        |                          |
    Platform adapters         Durable queues
        |                          |
   Supabase / storage        Scheduler / worker
   auth / HTTP / cache             |
        |                     Providers/renderers
        |                          |
        |                    QA / artifact store
        |                          |
        +-------------------- Publisher jobs
                                   |
                           YouTube / Facebook / Site
```

Cross-cutting observability/audit/security sits across all server-side layers, not inside individual page implementations.

## 9. Phase 2 refactor queue

| Priority | Refactor | Why |
| --- | --- | --- |
| P0 | Move kids result/progression logic out of API route | security, reuse, testability |
| P0 | Define one video job state machine | prevents API/worker/DB drift |
| P0 | Separate scheduler / queue / worker / publisher contracts | removes orchestration ambiguity |
| P1 | Move `src/lib/games` behind kids feature ownership | restore feature-first boundaries |
| P1 | Move domain-specific video/audio types/helpers out of `src/lib` | reduce shared-layer coupling |
| P1 | Consolidate route-local admin actions into feature/admin services | reuse + audit |
| P1 | Remove hardcoded site URL from worker | single configuration source |
| P1 | Replace `@ts-nocheck` on canonical gameplay paths | restore type contract |
| P2 | Normalize feature-to-feature import contracts | prevent hidden coupling |
| P2 | Update architecture/release documentation after ownership changes | eliminate documentation drift |

## 10. Phase 2 checkpoint criteria

Phase 2 is considered complete when:

- [x] All top-level runtime boundaries are mapped.
- [x] Route/API/feature/worker/provider relationships are documented.
- [x] Major direct-DB/API boundary violations are identified.
- [x] Domain code misplaced in shared infrastructure is identified.
- [x] Video scheduler/worker/publisher overlap is documented.
- [x] Target dependency rules are explicit.
- [ ] No source-code refactor is started until Phase 3 schema canonicalization uses this map as its dependency contract.

## 11. Evidence paths

- `src/app/quran/[surah]/page.tsx`
- `src/app/api/quran/audio/route.ts`
- `src/app/api/kids/games/submit-result/route.ts`
- `src/app/api/admin/videos/create/route.ts`
- `src/features/quran/services/quran-server.ts`
- `src/features/kids/services/games.ts`
- `src/features/admin/services/admin.ts`
- `src/features/videos/services/video-automation.ts`
- `src/features/videos/providers/provider-router.ts`
- `src/features/videos/providers/types.ts`
- `scripts/run-background-jobs.ts`
- `scripts/jobs/template-video-automation.ts`
- `.github/workflows/generate-ai-video.yml`
- `.github/workflows/quality-gate.yml`
- `.github/workflows/release-vercel.yml`
- `supabase/functions/prayer-notification-worker/index.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin-rest.ts`
- `src/lib/games/*`
- `src/lib/audio/*`
- `src/lib/types/video.ts`

No production behavior was changed by Phase 2.
