-- Add covering indexes for the seven foreign keys identified by Supabase Performance Advisor.
-- These child-side indexes support parent deletes/updates and common relation lookups.
-- The affected relations are currently small; IF NOT EXISTS keeps the migration repeat-safe.
CREATE INDEX IF NOT EXISTS idx_hadith_explanations_hadith_id
  ON public.hadith_explanations USING btree (hadith_id);

CREATE INDEX IF NOT EXISTS idx_recent_recitations_user_id
  ON public.recent_recitations USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_recent_recitations_reciter_id
  ON public.recent_recitations USING btree (reciter_id);

CREATE INDEX IF NOT EXISTS idx_reciter_favorites_reciter_id
  ON public.reciter_favorites USING btree (reciter_id);

CREATE INDEX IF NOT EXISTS idx_tawasheeh_favorites_tawasheeh_id
  ON public.tawasheeh_favorites USING btree (tawasheeh_id);

CREATE INDEX IF NOT EXISTS idx_tawasheeh_playlist_items_tawasheeh_id
  ON public.tawasheeh_playlist_items USING btree (tawasheeh_id);

CREATE INDEX IF NOT EXISTS idx_tawasheeh_playlists_user_id
  ON public.tawasheeh_playlists USING btree (user_id);
