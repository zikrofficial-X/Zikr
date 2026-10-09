-- Public bucket for the verified Android release artifacts (APK, AAB, checksums and metadata).
-- Public access is download-only. Upload/update remains restricted to service-role jobs.
BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'android-releases',
  'android-releases',
  true,
  536870912,
  ARRAY[
    'application/vnd.android.package-archive',
    'application/octet-stream',
    'text/plain',
    'application/json'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMIT;
