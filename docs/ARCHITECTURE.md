# Zikr — Architecture Overview

Islamic content platform built with Next.js (App Router) + Supabase.
This is the canonical architecture reference; historical reports live in `docs/reports/`.

## Stack

- **Framework:** Next.js (App Router, TypeScript, Tailwind)
- **Database:** Supabase (PostgreSQL, RLS, Storage, Auth)
- **ORM/schema mirror:** Drizzle (`drizzle/schema.ts`, config in `drizzle.config.ts`)
- **Package manager:** pnpm (single lockfile: `pnpm-lock.yaml`)
- **Verification:** Vercel runs `pnpm verify` on every deployment; GitHub Actions retains manual-only verification and recovery workflows while hosted runners are billing-locked
- **Hosting:** Vercel (`vercel.json`) with Supabase `pg_cron` and Edge Functions for production background scheduling

## Directory Map

| Path | Purpose |
| --- | --- |
| `app/` | All routes (pages + API). See "Routes" below. |
| `components/` | Shared React components (UI, layout, feature components). |
| `lib/` | Core services: `lib/supabase/client.ts` (browser client + legacy REST `request()` helper), `lib/supabase/server.ts` (async server client — must be awaited), types in `lib/types/`. |
| `hooks/`, `shared/` | Reusable hooks and shared utilities. |
| `config/` | App configuration. |
| `styles/` | Global styles. |
| `types/` | Global TypeScript types. |
| `public/` | Static assets, manifest, icons. |
| `supabase/migrations/` | Canonical migration chain (`0000_young_rattler` → `rls_triggers_storage`). |
| `supabase/migrations_archive/` | Legacy/conflicting migrations. Never apply. See its README. |
| `drizzle/` | Drizzle schema + drizzle-generated alignment migrations. |
| `scripts/` | One-off operational scripts (imports, audits, RLS checks). Run manually with env vars; not part of the build. |
| `proxy.ts` | Next.js middleware (Next 16 naming). |
| `docs/` | Guides (deployment, Google auth, video automation) and this file. |
| `docs/reports/` | Historical audit/status reports (archived from repo root). |

## Routes

### Content pages (public, read from Supabase)
Home (`/`, prayer times widget), `adhkar`, `articles(/[slug])`, `battles(/[slug])`,
`companions(/[slug])`, `conquests(/[slug])`, `dua(/[slug])`, `hadith(/[book]/[id])`,
`kids(/[slug])`, `poetry`, `prophets(/[slug])`, `quran(/[surah]/[ayah])`, `reciters`,
`scholars(/[slug])`, `stories(/[slug])`, `tafsir`, `tawasheeh`, `videos(/[slug])`, `youtube`.

### Tools
`prayer-times`, `prayer`, `qibla`, `tasbeeh`, `radio`, `memorization`, `search`,
`spiritual-ai`, `competitions`.

### User
`auth/login`, `auth/register`, `auth/forgot`, `profile`, `favorites`.

### Admin
`admin` (dashboard), `admin/analytics`, `admin/content`, `admin/users`, `admin/videos`.

### Static
`about`, `contact`, `faq`, `privacy`, `terms`.

### API routes (`app/api/`)
- `admin/*` — analytics, content management, video automation (create/retry/manage).
- `content/*` — articles, companions, prophets, stories.
- `duas`, `duas/categories`, `hadith/books`, `quran/surahs`, `tawasheeh(/categories)`.
- `search` — cross-content search.
- `user/*` — favorites, notifications, profile (auth-scoped).
- `poetry-insight` — AI-assisted poetry insight.

## Supabase Layer

- **Server:** `lib/supabase/server.ts` exports an **async** `createClient()` — always `await` it.
- **Browser:** `lib/supabase/client.ts` exports `createBrowserSupabaseClient()` which
  includes a legacy `request()` REST helper used by several client pages.
- **Migrations:** single canonical chain in `supabase/migrations/`. Duplicate/legacy
  files were archived (2026-07-05). If `supabase db push` reports a history mismatch,
  see `supabase/migrations_archive/README.md` for the `migration repair` command.
- **RLS:** hardened in `0008_rls_hardening` and `0015_comprehensive_rls`; public read
  for content tables, per-user scoping for `favorites`, `reading_progress`, profiles.

## Environment Variables

Validated by `scripts/validate-deployment-env.mjs` (`pnpm deploy:check`).
Documented in `docs/environment-variables.md`. Key vars:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SITE_URL`, `AUTH_CALLBACK_URL`.

## Known Constraints

- `pnpm` only — do not commit `package-lock.json`.
- Server Supabase client is async (Next 16 `cookies()` is async).
- Drizzle schema must be kept in sync with `supabase/migrations/` when tables change.
