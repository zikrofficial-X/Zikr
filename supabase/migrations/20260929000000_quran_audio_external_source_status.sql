-- Mark Quran audio served from a verified external MP3 source separately
-- from failed uploads; keep Storage rows intact until objects are removed via
-- the Storage API.
BEGIN;

ALTER TABLE public.quran_audio
  DROP CONSTRAINT IF EXISTS quran_audio_storage_status_check;

ALTER TABLE public.quran_audio
  ADD CONSTRAINT quran_audio_storage_status_check
  CHECK (storage_status IN ('pending','uploading','ready','failed','external'));

COMMENT ON COLUMN public.quran_audio.storage_status IS
  'Storage cache state; external means playback uses the direct MP3 in audio_url and no local Storage object is required.';

COMMIT;
