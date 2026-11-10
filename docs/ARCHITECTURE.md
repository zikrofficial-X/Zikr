# Zikr — Architecture Overview

ZIKR is an Islamic content and spiritual-tools platform built with Next.js App Router, TypeScript, Tailwind CSS, Supabase, and Capacitor.

This document describes the **current canonical architecture**. Historical audit/release material is kept under `docs/` and must not be treated as live architecture.

## Stack

- **Framework:** Next.js App Router + TypeScript + React
- **UI:** Tailwind CSS + shared components
- **Database/Auth/Storage:** Supabase (PostgreSQL, RLS, Storage, Auth, Edge Functions)
- **Database source of truth:** `supabase/migrations/`
- **Quran text source of truth:** `public/quran/mushaf-hafs.json` (Git-tracked Hafs/Uthmani snapshot, 6236 ayahs).
- **Package manager:** pnpm; `pnpm-lock.yaml` is the only lockfile
- **Mobile:** Capacitor with Android and iOS projects
- **Hosting:** Vercel
- **Automation:** GitHub Actions for video generation, social publishing, source verification, and controlled Vercel release; CircleCI for application/Android build artifacts, release documentation, Supabase gates, and English content sync
- **Prayer scheduling:** Supabase `pg_cron` → `prayer-notification-worker`

## Canonical Directory Map

| Path | Purpose |
| --- | --- |
| `src/app/` | Next.js routes, pages, layouts, API routes, and route-local actions |
| `src/features/` | Canonical feature modules. Domain components, hooks, services, types, data, and integrations live here |
| `src/components/ui/` | Shared design-system primitives and reusable UI building blocks |
| `src/components/layout/` | Shared application shell and cross-feature layout integrations |
| `src/lib/` | Cross-cutting infrastructure only |
| `src/config/` | Application configuration |
| `src/types/` | Global TypeScript types |
| `public/` | Static assets, PWA files, icons, audio, and offline content |
| `supabase/migrations/` | Canonical migration chain used for fresh/replay validation and production changes |
| `supabase/migrations_archive/` | Historical/legacy migration copies; never treated as the active migration chain |
| `supabase/functions/` | Supabase Edge Functions |
| `scripts/` | Deterministic verification, maintenance, migration, content, and release tooling |
| `android/`, `ios/`, `mobile/` | Native projects and mobile build metadata |
| `.github/workflows/` | Active scheduled/dispatchable automation workflows |
| `.circleci/` | Secondary CI, release, and manual recovery configuration |
| `docs/` | Current operational documentation |

### Path ownership rules

The repository uses **feature-first imports** for domain code.

- Prefer `@/features/<feature>/...` for feature services, hooks, types, data, components, and integrations.
- `@/components/ui/*` and `@/components/layout/*` are shared application infrastructure.
- `@/lib/*` is reserved for cross-cutting infrastructure.
- Do not recreate domain services under `src/lib/services/`.
- Do not create a second domain hook layer under `src/hooks/`.
- Legacy compatibility bridges that have no live consumers are removed rather than retained as parallel implementations.

## Routes

The canonical route inventory is generated/validated by `scripts/verify-platform-routes.mjs`.

Major public areas include:

- Quran, Mushaf, Tafsir, reciters
- Hadith
- Adhkar and Dua
- Prophets, Companions, Scholars
- Stories, Articles, Videos, Poetry
- Battles and Conquests
- Prayer Times, Qibla, Tasbeeh, Wird, Zakat
- Kids content and games
- Radio and Tawasheeh
- Search and Spiritual AI
- Authentication, profile, favorites, settings
- Administrative control center and operational tools

## Supabase Layer

- **Server client:** `src/lib/supabase/server.ts`
- **Browser client:** `src/lib/supabase/client.ts`
- **Migrations:** only `supabase/migrations/` is canonical.
- **RLS:** all production public tables are expected to remain protected by RLS.
- **Security:** privileged functions and admin data must remain scoped and must not be exposed to public roles.
- **Generated data:** application types and verification scripts must reflect the live schema.

## Environment Variables

Deployment validation is handled by repository scripts. Important variables include:

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `AUTH_CALLBACK_URL`, and provider-specific server secrets.

Secrets must never be committed. Only placeholders belong in `.env.example`.

## Verification

The canonical verification chain includes:

```text
pnpm supabase:migrations:check
pnpm supabase:migrations:replay
pnpm routes:check
pnpm imports:check
pnpm project:check
pnpm mobile:check
pnpm offline:check
pnpm content:check
pnpm auth:check
pnpm native-social:check
pnpm adsense:check
pnpm search-console:check
pnpm check
pnpm lint
pnpm build
```

All changes must leave the repository buildable and must not introduce a second implementation path for an existing feature.

## Automation Ownership

### Video generation and social publishing

`.github/workflows/generate-ai-video.yml` is the canonical production video worker. It runs at 03:17, 09:17, 15:17, and 21:17 UTC and on deliberate manual dispatch. It creates idempotent, source-locked Quran/Hadith/Dua/Adhkar/story requests, renders with free Hugging Face providers plus deterministic FFmpeg fallback, runs the automated source/audio/visual/caption/rights QA contract, and uploads verified MP4 bytes directly to Cloudinary. Supabase stores queue state, source and QA metadata, and audit records; generated video files are not staged in Supabase Storage. The worker creates eligible `social_publish_queue` candidates but never calls external publishing APIs.

`.github/workflows/publish-social.yml` is the canonical production social publisher. It runs after successful `generate-ai-video.yml` or `generate-written-content.yml` completion on `main`, on its bounded 15-minute schedule (UTC minutes 07, 22, 37, and 52), or by deliberate manual dispatch from `main`; it has no push trigger. It consumes only eligible post-cutoff queue records with current automated QA, independently enables platforms only after their OAuth readiness checks, and persists per-platform results, remote IDs, and bounded retry state. A partial video batch may complete successfully when at least one item passed QA, allowing eligible items to reach this worker while failed items remain in the video audit/retry queue.

### CircleCI

CircleCI is the application production/build lane. It builds the web application, generates release/build documentation artifacts, runs Supabase release gates, and builds/signs Android releases. CircleCI does not execute the production video or social worker.

### Supabase

Supabase `pg_cron` remains the authoritative scheduler for minute-level prayer notifications. The retired Vercel video cron is not restored.

## Known Operational Boundaries

- Vercel deployment success and application-code correctness are separate checks.
- External provider credentials (for example social publishing tokens) are runtime configuration, not source-code constants.
- Supabase performance advisories about unused indexes are informational and require workload evidence before destructive index removal.
- Do not add duplicate schedulers for the video or social queues. GitHub Actions is the sole scheduler/worker owner for those queues; CircleCI is not a fallback execution path for production video or social work.
