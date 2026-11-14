\set ON_ERROR_STOP on

DO $verify_site_audio_upload_intents$
DECLARE
  privilege_name text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class table_row
    JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
    WHERE namespace_row.nspname = 'public'
      AND table_row.relname = 'site_audio_upload_intents'
      AND table_row.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'site_audio_upload_intents must have RLS enabled';
  END IF;

  FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
    IF has_table_privilege('anon', 'public.site_audio_upload_intents', privilege_name) THEN
      RAISE EXCEPTION 'anon unexpectedly has % on site_audio_upload_intents', privilege_name;
    END IF;
    IF has_table_privilege('authenticated', 'public.site_audio_upload_intents', privilege_name) THEN
      RAISE EXCEPTION 'authenticated unexpectedly has % on site_audio_upload_intents', privilege_name;
    END IF;
  END LOOP;

  FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
    IF NOT has_table_privilege('service_role', 'public.site_audio_upload_intents', privilege_name) THEN
      RAISE EXCEPTION 'service_role is missing % on site_audio_upload_intents', privilege_name;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.site_audio_upload_intents'::regclass
      AND conname = 'site_audio_upload_intents_asset_id_fkey'
  ) THEN
    RAISE EXCEPTION 'registered upload intents must retain their canonical asset relationship';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'site_audio_upload_intents'
      AND indexname = 'site_audio_upload_intents_pending_cleanup_idx'
  ) THEN
    RAISE EXCEPTION 'expired pending upload intents need a bounded cleanup index';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'site_audio_upload_intents'
      AND indexname = 'site_audio_upload_intents_pending_cleanup_idx'
      AND indexdef LIKE '%deleting%'
      AND indexdef LIKE '%registered%'
      AND indexdef LIKE '%asset_id%'
  ) THEN
    RAISE EXCEPTION 'the cleanup index must cover deleting and detached registered intents';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_audio_upload_intents'
  ) THEN
    RAISE EXCEPTION 'site_audio_upload_intents must not expose client policies';
  END IF;
END
$verify_site_audio_upload_intents$;

INSERT INTO public.site_audio_assets (id, storage_path)
VALUES (
  '123e4567-e89b-12d3-a456-426614174001',
  '2b3c4d5e-6f70-4a1b-8c2d-3e4f5a6b7c8d/123e4567-e89b-12d3-a456-426614174002-recording.mp3'
);

INSERT INTO public.site_audio_upload_intents (
  storage_path, owner_user_id, mime_type, size_bytes,
  upload_expires_at, cleanup_after, status, asset_id
)
VALUES (
  '2b3c4d5e-6f70-4a1b-8c2d-3e4f5a6b7c8d/123e4567-e89b-12d3-a456-426614174002-recording.mp3',
  '2b3c4d5e-6f70-4a1b-8c2d-3e4f5a6b7c8d',
  'audio/mpeg',
  4096,
  now() - interval '48 hours',
  now() - interval '23 hours',
  'deleting',
  '123e4567-e89b-12d3-a456-426614174001'
);

DELETE FROM public.site_audio_assets
WHERE id = '123e4567-e89b-12d3-a456-426614174001';

DO $verify_site_audio_delete_lock$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.site_audio_upload_intents
    WHERE storage_path = '2b3c4d5e-6f70-4a1b-8c2d-3e4f5a6b7c8d/123e4567-e89b-12d3-a456-426614174002-recording.mp3'
      AND status = 'deleting'
      AND asset_id IS NULL
  ) THEN
    RAISE EXCEPTION 'deleting state must survive asset deletion while the FK clears asset_id';
  END IF;
END
$verify_site_audio_delete_lock$;

INSERT INTO public.site_audio_upload_intents (
  storage_path, owner_user_id, mime_type, size_bytes,
  upload_expires_at, cleanup_after, status, asset_id
)
VALUES (
  '2b3c4d5e-6f70-4a1b-8c2d-3e4f5a6b7c8d/123e4567-e89b-12d3-a456-426614174003-recording.mp3',
  '2b3c4d5e-6f70-4a1b-8c2d-3e4f5a6b7c8d',
  'audio/mpeg',
  4096,
  now() - interval '48 hours',
  now() - interval '23 hours',
  'registered',
  NULL
);

DO $verify_site_audio_detached_registered$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.site_audio_upload_intents
    WHERE storage_path = '2b3c4d5e-6f70-4a1b-8c2d-3e4f5a6b7c8d/123e4567-e89b-12d3-a456-426614174003-recording.mp3'
      AND status = 'registered'
      AND asset_id IS NULL
  ) THEN
    RAISE EXCEPTION 'detached registered intents must remain eligible for reference-checked reconciliation';
  END IF;
END
$verify_site_audio_detached_registered$;

SELECT 'SITE_AUDIO_UPLOAD_INTENTS_INTEGRATION_PASSED' AS result;
