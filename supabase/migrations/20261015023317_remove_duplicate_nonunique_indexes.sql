-- Remove non-unique indexes whose full btree key is already covered by an
-- identical UNIQUE index enforcing the same key/constraint.
--
-- Audited against production pg_index/pg_constraint and pg_stat_user_indexes on
-- 2026-10-15. The unique indexes remain intact and continue to support equality
-- lookups while enforcing uniqueness. These drops remove only redundant write
-- and storage overhead; no primary key or uniqueness constraint is removed.
--
-- Usage statistics were reset on 2026-10-02, so this migration targets only
-- structurally provable duplicates, not indexes flagged unused solely by scans.

DROP INDEX IF EXISTS public.hadith_books_slug_idx;
DROP INDEX IF EXISTS public.idx_kids_character_selection_user_id;
DROP INDEX IF EXISTS public.kids_content_slug_idx;
DROP INDEX IF EXISTS public.idx_kids_game_progress_user_game;
DROP INDEX IF EXISTS public.idx_prayer_preferences_user;
DROP INDEX IF EXISTS public.quran_surahs_slug_idx;
DROP INDEX IF EXISTS public.scholars_slug_idx;
DROP INDEX IF EXISTS public.stories_slug_idx;
