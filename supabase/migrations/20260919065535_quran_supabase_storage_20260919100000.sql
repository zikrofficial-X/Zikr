-- Canonical Quran audio storage.
-- Quran text remains in quran_ayahs; whole-surah recitations are stored in quran-audio.
-- Import is performed by scripts/import-quran-audio-to-supabase.mjs.

BEGIN;

ALTER TABLE public.quran_audio
  ADD COLUMN IF NOT EXISTS storage_bucket text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS storage_url text,
  ADD COLUMN IF NOT EXISTS storage_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS storage_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS storage_sha256 text,
  ADD COLUMN IF NOT EXISTS storage_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS mime_type text;

ALTER TABLE public.quran_audio
  DROP CONSTRAINT IF EXISTS quran_audio_storage_status_check;

ALTER TABLE public.quran_audio
  ADD CONSTRAINT quran_audio_storage_status_check
  CHECK (storage_status IN ('pending','uploading','ready','failed'));

CREATE UNIQUE INDEX IF NOT EXISTS quran_audio_surah_reciter_unique
  ON public.quran_audio (surah_id, reciter_id);

-- Public because Quran recitation is intentionally playable by anonymous visitors.
-- Writes remain controlled by Storage policies / service-role import tooling.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quran-audio',
  'quran-audio',
  true,
  52428800,
  ARRAY['audio/mpeg','audio/mp3']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "quran_audio_public_read" ON storage.objects;

CREATE POLICY "quran_audio_public_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'quran-audio');

-- Pre-create deterministic storage targets for every canonical reciter/surah row.
-- Use metadata/source URL instead of quran_reciters.code so this migration also
-- replays against the historical schema stubs used by the CI verifier.
UPDATE public.quran_audio AS a
SET
  storage_bucket = 'quran-audio',
  storage_path = 'reciters/' ||
    regexp_replace(
      lower(coalesce(a.metadata->>'reciter_code', split_part(a.audio_url, '/', 4), 'unknown')),
      '^ar\\.',
      ''
    ) ||
    '/' || lpad(a.surah_id::text, 3, '0') || '.mp3',
  mime_type = 'audio/mpeg'
WHERE a.surah_id between 1 and 114;

UPDATE public.quran_audio AS a
SET storage_url =
  'https://kdotmrjfecgafiommzwz.supabase.co/storage/v1/object/public/quran-audio/' ||
  a.storage_path
WHERE a.storage_bucket = 'quran-audio'
  AND a.storage_path IS NOT NULL;

COMMIT;
