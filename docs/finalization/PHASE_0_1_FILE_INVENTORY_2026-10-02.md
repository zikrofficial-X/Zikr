# ZIKR Finalization — Phase 1 File / System Inventory

Date: 2026-10-02
Baseline commit: e1b84fac78d1ddb1fb971f7ec456b5ae37936edf

## Repository scale snapshot

The supplied ZIP snapshot contains 1,021 files and approximately 117 MB. It is used only as a structural audit snapshot because it is not treated as a competing source of truth for current GitHub main.

Major directories observed in the snapshot:

| Area | Approx. files | Role |
|---|---:|---|
| src | 484 | application routes, domain features, services, UI |
| supabase | 297 | migrations, functions, SQL/archive |
| docs | 45 | operational/project documentation |
| public | 54 | public assets/offline content |
| scripts | 24 | verification/import/automation scripts |
| android | 56 | Capacitor Android project |
| ios | 19 | Capacitor iOS project |
| .github | 3 | GitHub Actions |
| .circleci | 1 | secondary/recovery CI |
| mobile | 2 | mobile configuration/assets |

## High-risk implementation zones

### 1. Database / migrations

- 284 SQL files were present in the supplied snapshot.
- Canonical chain: supabase/migrations/.
- Historical/archive material exists in supabase/migrations_archive/ and supabase/legacy_migrations/.
- Migration history has required several reconciliation markers during September/October 2026. This area is a release-critical dependency and will be normalized before deleting any legacy SQL.

### 2. Video system

Active runtime paths observed in GitHub include:

- src/features/videos/services/video-automation.ts
- scripts/jobs/template-video-automation.ts
- src/features/videos/providers/provider-router.ts
- src/features/videos/providers/types.ts
- src/features/videos/providers/hf-space-provider.ts
- src/features/videos/providers/free-api-provider.ts
- src/features/videos/providers/comfyui-provider.ts
- src/features/videos/providers/template-provider.ts
- src/app/api/internal/video-generation/daily/route.ts
- src/app/api/internal/video-processing/route.ts
- admin video-generation/video queue routes and pages

The video system is therefore not one script; it is a multi-layer pipeline and must be refactored as a single domain.

### 3. Automation

Current operational pieces include:

- GitHub scheduled video worker.
- scripts/run-background-jobs.ts.
- Supabase-backed video queue.
- social publish queue.
- content-agent queue/run tables and Edge Function.
- prayer notification worker.
- manual CircleCI background recovery path.

The target architecture must clearly separate scheduler, worker, queue, provider, and publisher responsibilities.

### 4. Admin

Current admin surface contains separate pages for health, automation, AI video, videos, social, editorial, media, sources, content, knowledge, kids, Android, SEO, security, settings, audit, users, notifications, analytics, sections and releases.

This is feature-rich but operationally fragmented. A canonical admin information architecture will be defined before pages are deleted or merged.

### 5. Kids

Current production schema contains 12 game_scenarios rows. game_graphics, video_narrations, and free_tier_usage currently have zero rows. These tables therefore require dependency verification before being retained as runtime infrastructure.

The 12-game runtime itself is already treated as a canonical feature area and must not be removed during cleanup.

### 6. Quran / audio

Canonical live tables include:

- quran_surahs
- quran_ayahs
- quran_reciters
- quran_audio
- quran_tafsir

Audio source/storage selection is currently distributed between database columns, service code, and storage metadata. This will be consolidated into one Quran audio service contract.

## Asset duplication hotspot

The supplied snapshot contains multiple copies of large audio files across public/, Android resources and iOS resources. Large offline JSON files also exist in multiple public paths. These are candidates for deduplication after checking runtime/native packaging requirements.

Representative large files from the audit snapshot include:

- public/quran/mushaf-hafs.json
- public/offline-content/v1/ayahs.json
- public/offline-content/v1/hadith.json
- multiple adhan*.wav copies across web/Android/iOS
- public/audio/adhan.mp3 plus native copies
- multiple kids theme MP3 assets

No asset will be deleted until references are proven absent from web, PWA/offline, Android and iOS builds.

## Verification tooling already present

The repository already contains verification scripts for migrations, routes, local imports, content integrity, project integrity, authentication config, canonical URLs, mobile readiness, offline content, placeholder media, native social sync, AdSense readiness, Search Console, repository hygiene, video engine and multiple kids-game runtimes.

The cleanup goal is not to add duplicate checks. It is to consolidate these checks under a small, explicit release gate.