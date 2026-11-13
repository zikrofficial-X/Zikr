\set ON_ERROR_STOP on

DO $contract$
DECLARE
  function_definition text;
BEGIN
  IF public.video_storage_retention_contract_ready() IS NOT TRUE THEN
    function_definition := pg_catalog.pg_get_functiondef(
      'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)'::regprocedure
    );
    RAISE EXCEPTION 'The installed retention RPC did not pass its own contract check. Definition: %', function_definition;
  END IF;

  IF has_function_privilege('anon', 'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous clients must not execute the video retention RPC.';
  END IF;
  IF has_function_privilege('authenticated', 'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Authenticated clients must not execute the video retention RPC.';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)', 'EXECUTE') THEN
    RAISE EXCEPTION 'The service role must execute the video retention RPC.';
  END IF;
END
$contract$;

-- PostgreSQL omits the default SECURITY INVOKER clause from pg_get_functiondef().
-- The preflight must therefore inspect pg_proc.prosecdef, not search the deparsed SQL.
BEGIN;
ALTER FUNCTION public.update_video_storage_retention(uuid, uuid, text, jsonb, boolean) SECURITY DEFINER;
DO $security_definer$
BEGIN
  IF public.video_storage_retention_contract_ready() IS NOT FALSE THEN
    RAISE EXCEPTION 'The retention preflight must reject a SECURITY DEFINER RPC.';
  END IF;
END
$security_definer$;
ROLLBACK;

-- DML keywords inside a SQL comment must not be mistaken for executable statements.
BEGIN;
DO $comment_update_guard$
DECLARE
  definition text;
  original_definition text;
BEGIN
  original_definition := pg_catalog.pg_get_functiondef(
    'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)'::regprocedure
  );
  definition := pg_catalog.replace(
    original_definition,
    '  -- Parse both UPDATE statements.',
    '  -- UPDATE INSERT DELETE TRUNCATE EXECUTE CALL PERFORM SELECT COPY marker only.'
  );

  IF definition = original_definition THEN
    RAISE EXCEPTION 'Could not inject the comment-only DML regression probe.';
  END IF;

  EXECUTE definition;

  IF public.video_storage_retention_contract_ready() IS NOT TRUE THEN
    RAISE EXCEPTION 'The retention preflight must ignore DML keywords inside SQL comments.';
  END IF;
END
$comment_update_guard$;
ROLLBACK;

CREATE FUNCTION pg_temp.expect_retention_rejection(p_statement text, p_expected_message text)
RETURNS void
LANGUAGE plpgsql
AS $expect$
DECLARE
  actual_message text;
BEGIN
  BEGIN
    EXECUTE p_statement;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS actual_message = MESSAGE_TEXT;
    IF pg_catalog.strpos(actual_message, p_expected_message) > 0 THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'Unexpected retention rejection: % (expected %)', actual_message, p_expected_message;
  END;

  RAISE EXCEPTION 'Expected retention RPC rejection containing: %', p_expected_message;
END;
$expect$;

SELECT pg_temp.expect_retention_rejection(
  $sql$SELECT public.update_video_storage_retention(
    '50000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
    '[]'::jsonb,
    false
  )$sql$,
  'expected an object'
);

SELECT pg_temp.expect_retention_rejection(
  $sql$SELECT public.update_video_storage_retention(
    '50000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
    '{"state":"pending","bucket":"videos","path":"automated/auto-story-test.mp4"}'::jsonb,
    false
  )$sql$,
  'state must be purge_pending or purged'
);

SELECT pg_temp.expect_retention_rejection(
  $sql$SELECT public.update_video_storage_retention(
    '50000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
    '{"state":"purge_pending","bucket":"videos","path":"automated/auto-story-test.mp4"}'::jsonb,
    true
  )$sql$,
  'finalize flag does not match'
);

SELECT pg_temp.expect_retention_rejection(
  $sql$SELECT public.update_video_storage_retention(
    '50000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    '   ',
    '{"state":"purge_pending","bucket":"videos","path":"automated/auto-story-test.mp4"}'::jsonb,
    false
  )$sql$,
  'requires the exact expected playback URL'
);

SELECT pg_temp.expect_retention_rejection(
  $sql$SELECT public.update_video_storage_retention(
    '50000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
    '{"state":"purge_pending","bucket":"other","path":"automated/auto-story-test.mp4"}'::jsonb,
    false
  )$sql$,
  'managed videos-bucket path'
);

SELECT pg_temp.expect_retention_rejection(
  $sql$SELECT public.update_video_storage_retention(
    '50000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
    '{"state":"purge_pending","bucket":"videos","path":"   "}'::jsonb,
    false
  )$sql$,
  'managed videos-bucket path'
);

BEGIN;
GRANT EXECUTE ON FUNCTION public.update_video_storage_retention(uuid, uuid, text, jsonb, boolean) TO anon;
DO $preflight_acl$
BEGIN
  IF public.video_storage_retention_contract_ready() IS NOT FALSE THEN
    RAISE EXCEPTION 'The live retention preflight must fail when anon gains EXECUTE on the destructive RPC.';
  END IF;
END
$preflight_acl$;
ROLLBACK;

-- The worker keeps the Cloudinary URL in both records while it removes only the
-- redundant Supabase staging object. Both the pending and finalization RPC calls
-- must preserve that exact durable playback URL.
INSERT INTO public.social_publish_queue (id, content_id, status, video_url, metadata)
VALUES (
  '50000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000001',
  'published',
  'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
  '{}'::jsonb
);

INSERT INTO public.video_generation_requests (id, status, video_url, content)
VALUES (
  '60000000-0000-4000-8000-000000000001',
  'completed',
  'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
  '{}'::jsonb
);

-- A queue update followed by a missing request row must roll back atomically.
INSERT INTO public.social_publish_queue (id, content_id, status, video_url, metadata)
VALUES (
  '50000000-0000-4000-8000-000000000002',
  '60000000-0000-4000-8000-000000000002',
  'published',
  'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
  '{}'::jsonb
);
SELECT pg_temp.expect_retention_rejection(
  $sql$SELECT public.update_video_storage_retention(
    '50000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000002',
    'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
    '{"state":"purge_pending","bucket":"videos","path":"automated/auto-story-test.mp4"}'::jsonb,
    false
  )$sql$,
  'Expected exactly one completed video generation row'
);
DO $atomicity$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.social_publish_queue
    WHERE id = '50000000-0000-4000-8000-000000000002'
      AND metadata ? 'storageRetention'
  ) THEN
    RAISE EXCEPTION 'A failed request-row update must roll back the earlier queue-row update.';
  END IF;
END
$atomicity$;

SELECT public.update_video_storage_retention(
  '50000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000001',
  'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
  '{"state":"purge_pending","bucket":"videos","path":"automated/auto-story-test.mp4"}'::jsonb,
  false
);

DO $pending$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.social_publish_queue
    WHERE id = '50000000-0000-4000-8000-000000000001'
      AND video_url = 'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4'
      AND metadata->'storageRetention'->>'state' = 'purge_pending'
  ) THEN
    RAISE EXCEPTION 'Pending retention must preserve the Cloudinary queue playback URL.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.video_generation_requests
    WHERE id = '60000000-0000-4000-8000-000000000001'
      AND video_url = 'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4'
      AND content->'storageRetention'->>'state' = 'purge_pending'
  ) THEN
    RAISE EXCEPTION 'Pending retention must preserve the Cloudinary request playback URL.';
  END IF;
END
$pending$;

SELECT pg_temp.expect_retention_rejection(
  $sql$SELECT public.update_video_storage_retention(
    '50000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
    '{"state":"purged","bucket":"videos","path":"automated/other-path.mp4"}'::jsonb,
    true
  )$sql$,
  'Expected exactly one published social queue row'
);
DO $path_guard$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.social_publish_queue
    WHERE id = '50000000-0000-4000-8000-000000000001'
      AND metadata->'storageRetention'->>'state' = 'purge_pending'
      AND metadata->'storageRetention'->>'path' = 'automated/auto-story-test.mp4'
  ) THEN
    RAISE EXCEPTION 'A mismatched finalization path must leave the exact pending path unchanged.';
  END IF;
END
$path_guard$;

SELECT public.update_video_storage_retention(
  '50000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000001',
  'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4',
  '{"state":"purged","bucket":"videos","path":"automated/auto-story-test.mp4"}'::jsonb,
  true
);

DO $purged$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.social_publish_queue
    WHERE id = '50000000-0000-4000-8000-000000000001'
      AND video_url = 'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4'
      AND metadata->'storageRetention'->>'state' = 'purged'
  ) THEN
    RAISE EXCEPTION 'Final retention must preserve the Cloudinary queue playback URL.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.video_generation_requests
    WHERE id = '60000000-0000-4000-8000-000000000001'
      AND video_url = 'https://res.cloudinary.com/dcuveyab9/video/upload/v1/auto-story-test.mp4'
      AND content->'storageRetention'->>'state' = 'purged'
  ) THEN
    RAISE EXCEPTION 'Final retention must preserve the Cloudinary request playback URL.';
  END IF;
END
$purged$;

-- The preflight must reject a third UPDATE to any unrelated table, not merely
-- validate the two expected queue/request UPDATE statements independently.
CREATE SCHEMA retention_probe;
CREATE TABLE retention_probe.retention_contract_probe (
  touched_at timestamptz
);

DO $extra_update_guard$
DECLARE
  definition text;
  original_definition text;
BEGIN
  original_definition := pg_catalog.pg_get_functiondef(
    'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)'::regprocedure
  );
  definition := pg_catalog.replace(
    original_definition,
    '  GET DIAGNOSTICS request_rows = ROW_COUNT;',
    '  UPDATE retention_probe.retention_contract_probe SET touched_at = now();' || E'\n  GET DIAGNOSTICS request_rows = ROW_COUNT;'
  );

  IF definition = original_definition THEN
    RAISE EXCEPTION 'Could not inject the third-UPDATE regression probe into the retention RPC.';
  END IF;

  EXECUTE definition;

  IF public.video_storage_retention_contract_ready() IS NOT FALSE THEN
    RAISE EXCEPTION 'The retention preflight must reject an extra UPDATE outside the queue/request pair.';
  END IF;
END
$extra_update_guard$;
