-- Remove unused non-unique B-tree indexes whose full key is an exact
-- leading prefix of a longer valid B-tree index on the same table.
-- The candidates were checked against pg_index, pg_constraint and
-- pg_stat_user_indexes on 2026-10-15. No primary/unique constraint or partial
-- index is removed. Usage statistics were reset on 2026-10-02.

DROP INDEX IF EXISTS public.idx_scholars_published;
DROP INDEX IF EXISTS public.idx_video_requests_status;
DROP INDEX IF EXISTS public.content_translation_queue_content_idx;
DROP INDEX IF EXISTS public.idx_kids_game_results_game_id;
DROP INDEX IF EXISTS public.idx_kids_game_progress_user_id;
DROP INDEX IF EXISTS public.idx_kids_game_results_user_id;
DROP INDEX IF EXISTS public.idx_kids_game_progress_game_id;
DROP INDEX IF EXISTS public.prayer_schedule_cache_lookup_idx;
