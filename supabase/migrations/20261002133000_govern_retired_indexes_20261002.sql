-- Phase 19: remove only indexes whose parent runtime contracts are retired
-- or whose provider path is explicitly retired. Constraint-backed unique/PK
-- indexes are intentionally preserved.

BEGIN;

DROP INDEX IF EXISTS public.hadith_explanations_hadith_id_idx;

DROP INDEX IF EXISTS public.idx_recent_recitations_user;
DROP INDEX IF EXISTS public.recent_recitations_played_at_idx;
DROP INDEX IF EXISTS public.recent_recitations_reciter_id_idx;

DROP INDEX IF EXISTS public.reciter_favorites_reciter_id_idx;

DROP INDEX IF EXISTS public.idx_tawasheeh_favorites_user;
DROP INDEX IF EXISTS public.tawasheeh_favorites_tawasheeh_id_idx;

DROP INDEX IF EXISTS public.idx_tawasheeh_playlists_user;

DROP INDEX IF EXISTS public.tawasheeh_playlist_items_tawasheeh_id_idx;

-- HeyGen is retained only as schema compatibility/history. It is no longer
-- selected or executed by the production video worker.
DROP INDEX IF EXISTS public.idx_video_generation_requests_processing_heygen;

COMMIT;
