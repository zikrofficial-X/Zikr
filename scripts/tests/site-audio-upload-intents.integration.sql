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

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_audio_upload_intents'
  ) THEN
    RAISE EXCEPTION 'site_audio_upload_intents must not expose client policies';
  END IF;
END
$verify_site_audio_upload_intents$;

SELECT 'SITE_AUDIO_UPLOAD_INTENTS_INTEGRATION_PASSED' AS result;
