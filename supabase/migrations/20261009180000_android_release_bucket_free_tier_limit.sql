-- Keep the Android release bucket within Supabase Free-tier's 50 MiB project upload limit.
-- The APK/AAB objects verified on 2026-10-09 are 36,939,736 and 31,872,484 bytes.
-- The original 512 MiB value remains in historical migration 20261009145051; do not rewrite applied history.
BEGIN;

UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'android-releases'
  AND file_size_limit IS DISTINCT FROM 52428800;

COMMIT;
