-- Cache public playlist metadata alongside the private YouTube sync state.
-- The service-role worker reads and writes this snapshot; no browser-role grants change.
BEGIN;

ALTER TABLE public.youtube_sync_state
  ADD COLUMN IF NOT EXISTS playlists jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.youtube_sync_state
  DROP CONSTRAINT IF EXISTS youtube_sync_state_playlists_array_check;

ALTER TABLE public.youtube_sync_state
  ADD CONSTRAINT youtube_sync_state_playlists_array_check
  CHECK (jsonb_typeof(playlists) = 'array');

COMMIT;
