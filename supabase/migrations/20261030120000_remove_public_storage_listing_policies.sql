-- Security hardening: public buckets remain publicly readable by object URL,
-- but anonymous clients must not be able to enumerate every object in them.
--
-- Supabase public buckets serve /object/public/<bucket>/<path> without a
-- SELECT policy on storage.objects. Keep bucket.public=true and preserve the
-- admin write/delete policies; remove only broad object-listing SELECT access.

BEGIN;

DROP POLICY IF EXISTS "public_assets_read" ON storage.objects;
DROP POLICY IF EXISTS "quran_audio_public_read" ON storage.objects;
DROP POLICY IF EXISTS "site_audio_public_read" ON storage.objects;
DROP POLICY IF EXISTS "video_assets_public_read" ON storage.objects;

COMMIT;
