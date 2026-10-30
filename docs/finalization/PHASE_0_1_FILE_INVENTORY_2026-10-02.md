# ZIKR Finalization — Phase 1 Current Repository Inventory

Date: 2026-10-30
Current main commit audited: `57e9767cf4a1980e9d947ee4a8f5982b46aa42a9`
Canonical source: `zikrofficial-X/Zikr` on GitHub `main`. The supplied ZIP is an older snapshot and is not treated as the source of truth.

## Current repository scale

GitHub recursive tree audit: **1,433 tracked files**.

| Area | Files | Role |
|---|---:|---|
| `src` | 605 | Next.js routes, domain features, shared UI and infrastructure |
| `src/app` | 301 | Route/page/layout/API entrypoints |
| `src/features` | 206 | Domain feature modules |
| `src/components` | 40 | Shared UI/layout components |
| `src/lib` | 56 | Cross-cutting infrastructure and remaining domain helpers |
| `scripts` | 86 | Verification, workers, imports, maintenance and release tooling |
| `supabase/migrations` | 374 | Active migration source on main; production ledger has 376 versions |
| `supabase/migrations_archive` | 35 | Historical SQL archive; not executable source |
| `supabase/functions` | 8 | Supabase Edge Functions |
| `android` | 56 | Capacitor Android project |
| `ios` | 19 | Capacitor iOS project |
| `public` | 62 | Public/PWA/offline/media assets |
| `docs` | 138 | Operational and historical documentation |
| `.github/workflows` | 12 | CI, scheduled workers and release automation |
| `.circleci` | 1 | Secondary/recovery CI configuration |

Additional entrypoint counts:
- 228 Next.js page/layout/route entry files under `src/app`.
- 53 admin page entrypoints.
- 66 API route handlers under `src/app/api`.

## Migration-history reconciliation

Production Supabase records **376 migration versions**. Main had 374 SQL files at the audit point. Two production-recorded Arabic FTS migrations were absent from the repository and are restored by the current PR using their exact production version numbers. A third new Phase 19 migration removes only verified unused indexes and remains pending until the release workflow applies it.

## Exact duplicate-content audit

The Git tree contains **38 duplicate blob groups spanning 81 paths**. These are not automatically redundant.

| Duplicate class | Groups | Decision |
|---|---:|---|
| Migration copies / archived SQL | 22 | Preserve versioned history; do not deduplicate active migration files |
| Web/native packaged assets | 9 | Preserve until web/PWA/Android/iOS packaging references are proven redundant |
| Android resource variants | 5 | Preserve resource-density/resource-name contracts |
| iOS asset variants | 1 | Preserve until Xcode asset-catalog references are checked |
| Offline/Quran datasets | 1 | Preserve until offline manifest and runtime consumers are checked |
| Other | 0 | None identified in this snapshot |

No asset or migration file is deleted based on identical Git blob content alone.

## High-risk implementation zones

### Database / migrations
- The executable source is `supabase/migrations/`.
- `supabase/migrations_archive/` and legacy folders are historical only.
- Production schema has normalized Arabic FTS columns and 10 valid/ready GIN indexes.
- Six runtime-retired tables are empty and have no source consumer; table structures/RLS policies remain.

### Video / automation
- The video worker is `scripts/jobs/template-video-automation.ts` (1,536 lines at audit time).
- Scheduler ownership is GitHub Actions.
- `scripts/run-background-jobs.ts` loads Supabase-backed automation settings.
- Social publishing uses a separate scheduled workflow and `social_publish_queue`.
- Phase 0 safety freeze currently disables automatic AI visual generation and automatic publishing; template rendering remains available.

### Kids
- 13 canonical `kids_games` rows are present in production.
- 35 `kids_content` rows are classified as game content.
- `src/app/api/kids/games/submit-result/route.ts` now delegates persistence/progression to `recordKidsGameResultForUser`; the legacy route is deprecated and no longer uses `@ts-nocheck`.
- The old `game_scenarios` table is unexpectedly absent despite the Phase 18 migration preserving 12 rows on 2026-10-02. Provenance remains unresolved; do not claim those records were migrated.

### Domain code still misplaced in shared infrastructure
- `src/lib/games/*`: 23 domain-specific files remain.
- `src/lib/audio/*`: 3 domain-specific files remain.
- `src/lib/types/video.ts`: video-domain types remain under shared types.
These are Phase 2 refactor targets, not proven-unused files.

## Asset duplication hotspot

Identical content exists across:
- public/Android/iOS adhan and recitation audio;
- Android density-specific launcher resources;
- offline Quran data paths;
- active and archived migration history.

No deletion is approved without a reference scan across web, PWA/offline, Android and iOS.

## Verification tooling

Current package scripts include migration validation/replay, schema contracts, route and architecture checks, imports, image/content integrity, auth/canonical URL checks, mobile/offline readiness, Search Console/AdSense readiness, video/AI visual/QA/scheduler/social checks, admin governance/API checks and kids-game regression suites.

Phase 1 is a current inventory, not a claim that every architectural refactor or external-service setup is complete.
