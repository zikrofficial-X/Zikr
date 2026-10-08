# ZIKR Database Schema Index

## Canonical database architecture

The production database is **Supabase PostgreSQL**.

Database schema changes have one deployment path:

`supabase/migrations/*.sql`

The application runtime does not use Drizzle ORM, `drizzle-kit`, `drizzle.config.ts`, or a direct `DATABASE_URL`.

## Current project

- Supabase project ref: `wvetcauyerlkqvmntajq` (selected to match Vercel on 2026-10-08)
- Canonical migration directory: `supabase/migrations/`
- Historical migrations/archive: `supabase/migrations_archive/`
- Generated TypeScript database types: `src/lib/types/supabase.ts`
- Supabase Edge Functions: `supabase/functions/`
- Row-Level Security: rechecked on 2026-10-08; all 82 public tables had RLS enabled.
- Application data access: Supabase client / REST / server-side Supabase helpers.
- Read-only production schema verification confirms `content_library.summary_en` and `public.content_translation_queue` are present on the selected target.
- Previously recorded schema counts and migration history refer to `kdotmrjfecgafiommzwz`; they are not proof that the selected target has the same schema. No database scripts or migrations were applied during this reconciliation.

## Migration rules

1. Create every new schema change as a new timestamped SQL file under `supabase/migrations/`.
2. Never edit or delete an already-applied production migration merely to make history look cleaner.
3. Never reset production migration history to solve local/preview drift.
4. Validate migration ordering and replay with:
   `pnpm supabase:migrations:check`
   and
   `pnpm supabase:migrations:replay`.
5. Use Supabase's authenticated migration workflow to deploy schema changes.

## Historical Drizzle references

The repository still contains historical migration records whose filenames/comments mention Drizzle. They are retained because they are part of the recorded database history and reconciliation trail.

They are **not** an active Drizzle deployment mechanism.

Do not recreate `drizzle/`, add `drizzle-orm`, add `drizzle-kit`, or introduce a second ORM schema-push path.

## Required application domains

The application migration chain declares the following domains; the scheduler, authentication, Quran, kids, content-library, translation-queue, and RLS contracts are actively verified in production:

- Quran: `quran_surahs`, `quran_ayahs`, `quran_tafsir`, `quran_reciters`, `quran_audio`
- Authentication/profile: `profiles` and related account tables
- Content: articles, stories, prophets, companions, battles, conquests, duas, hadith, scholars, kids, tawasheeh
- User activity: favorites, reading/memorization/progress, reminders, notifications
- Automation: video generation queues, social publishing queues, scheduler state
- Audit/security: administrative audit records, role/RLS controls, internal scheduler tables

## Historical Quran audit

The recorded audit of the previous `kdotmrjfecgafiommzwz` project established:

- 114 Quran surahs
- 6236 Quran ayahs
- 6236 tafsir rows
- 7 reciter records
- 798 Quran-audio rows representing 114 × 7 surah/reciter targets

Quran runtime reads the Git-tracked Hafs/Uthmani corpus first; Supabase remains a compatibility/content layer. External Quran APIs may appear only in ingestion or research tooling and are not required for reader runtime.

## Security invariants

- RLS is mandatory for production application tables.
- Service-role credentials are server-side only.
- Admin access is enforced through server-side/admin predicates.
- Public content policies are limited to intended published/active records.
- Do not grant regular users access to internal scheduler or administrative data.

## Related verification

Use the canonical repository checks:

`pnpm project:check`
`pnpm hygiene:check`
`pnpm auth:check`
`pnpm canonical:check`
`pnpm supabase:migrations:check`
`pnpm supabase:migrations:replay`
`pnpm verify`

For the current authentication URL contract, see:

`docs/CANONICAL_AUTH_CONFIG.md`
