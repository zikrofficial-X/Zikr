# Migration summary

This migration (20260705000000_0019_safety_fixes.sql) makes several safety fixes intended to be
idempotent and safe to run against existing Supabase/Postgres databases. It was added to address
issues found during a schema audit:

- Clean duplicate quran_reciters.code values and create a unique index safely.
- Ensure `articles.tags` default is typed as `text[]`.
- Guard UPDATE statements that reference optional columns (e.g. `text_uthmani`, `text_simple`).
- Ensure `quran_tafsir.tafsir_ar` has non-null values where applicable.
- Add foreign key constraints for story_reads/story_ratings/story_favorites only if `stories` table exists.

Run: pnpm db:migrate:supabase (or let your deployment apply it).
