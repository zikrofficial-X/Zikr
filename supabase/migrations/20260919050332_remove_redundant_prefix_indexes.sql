-- Remove non-unique prefix indexes that are fully covered by a longer
-- index with the same leading key columns. No primary/unique constraint
-- semantics are removed.

drop index if exists public.articles_category_idx;
drop index if exists public.battles_published_idx;
drop index if exists public.companions_published_idx;
drop index if exists public.idx_kids_content_published;
drop index if exists public.kids_content_public_idx;
drop index if exists public.memorization_progress_user_idx;
drop index if exists public.prayer_locations_user_id_idx;
drop index if exists public.prophet_notes_user_id_idx;
drop index if exists public.recent_recitations_user_idx;
drop index if exists public.reciter_favorites_user_idx;
drop index if exists public.social_sync_jobs_retry_idx;
drop index if exists public.story_favorites_user_id_idx;
drop index if exists public.story_reads_user_id_idx;
drop index if exists public.tawasheeh_favorites_user_idx;
