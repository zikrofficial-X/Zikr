# Zikr — Architecture Overview

ZIKR is an Islamic content and spiritual-tools platform built with Next.js App Router, TypeScript, Tailwind CSS, Supabase, and Capacitor.

This document describes the **current canonical architecture**. Historical audit/release material is kept under `docs/` and must not be treated as live architecture.

## Stack

- **Framework:** Next.js App Router + TypeScript + React
- **UI:** Tailwind CSS + shared components
- **Database/Auth/Storage:** Supabase (PostgreSQL, RLS, Storage, Auth, Edge Functions)
- **Database source of truth:** `supabase/migrations/`
- **Package manager:** pnpm; `pnpm-lock.yaml` is the only lockfile
- **Mobile:** Capacitor with Android and iOS projects
- **Hosting:** Vercel
- **Verification:** Vercel deployment/build checks plus the external CI path configured outside GitHub Actions

## Canonical Directory Map

| Path | Purpose |
| --- | --- |
| `src/app/` | Next.js routes, pages, layouts, API routes, and route-local actions |
| `src/features/` | Canonical feature modules. Domain components, hooks, services, types, data, and integrations live here |
| `src/components/ui/` | Shared design-system primitives and reusable UI building blocks |
| `src/components/layout/` | Shared application shell and cross-feature layout integrations |
| `src/lib/` | Cross-cutting infrastructure only: Supabase clients, environment handling, HTTP transport, storage helpers, offline persistence, i18n, site metadata, and shared types/utils |
| `src/config/` | Application configuration |
| `src/types/` | Global TypeScript types |
| `public/` | Static assets, PWA files, icons, audio, and offline content |
| `supabase/migrations/` | Canonical migration chain used for fresh/replay validation and production changes |
| `supabase/migrations_archive/` | Historical/legacy migration copies; never treated as the active migration chain |
| `supabase/functions/` | Supabase Edge Functions |
| `scripts/` | Deterministic verification, maintenance, migration, content, and release tooling |
| `__tests__/` | Unit and integration tests |
| `android/`, `ios/`, `mobile/` | Native projects and mobile build metadata |
| `.github/` | Repository metadata only; GitHub Actions workflows are intentionally retired |
| `.circleci/` | CircleCI configuration retained for secondary CI/recovery validation |
| `docs/` | Current guides, operational documentation, audits, and historical records |

### Path ownership rules

The repository uses **feature-first imports** for domain code.

- Prefer `@/features/<feature>/...` for feature services, hooks, types, data, components, and integrations.
- `@/components/ui/*` and `@/components/layout/*` are shared application infrastructure.
- `@/lib/*` is reserved for cross-cutting infrastructure.
- Do not recreate domain services under `src/lib/services/`.
- Do not create a second domain hook layer under `src/hooks/`.
- Legacy compatibility bridges that have no live consumers are removed rather than retained as parallel implementations.

The import verifier enforces the remaining infrastructure boundary. The only permitted feature/app imports through `@/lib/services/*` are the shared infrastructure modules explicitly allowlisted by the verifier.

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

- **Server client:** `src/lib/supabase/server.ts` provides the async server client.
- **Browser client:** `src/lib/supabase/client.ts` provides the browser Supabase client.
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
pnpm test
pnpm build
```

All changes must leave the repository buildable and must not introduce a second implementation path for an existing feature.

## Known Operational Boundaries

- Vercel deployment success and application-code correctness are separate checks.
- External provider credentials (for example social publishing tokens) are runtime configuration, not source-code constants.
- Supabase performance advisories about unused indexes are informational and require workload evidence before destructive index removal.
- GitHub Actions workflows are intentionally absent from the active repository. Do not recreate them for CI, scheduling, releases, or background processing.
