-- Harden the service-only video retention bookkeeping RPC.
-- The cleanup worker must prove the queue/request relationship and use matching
-- pending/final states while retaining the Cloudinary playback URL in both records;
-- only the redundant Supabase staging copy recorded in p_retention.path is removed.

BEGIN;

CREATE OR REPLACE FUNCTION public.update_video_storage_retention(
  p_queue_id uuid,
  p_request_id uuid,
  p_expected_url text,
  p_retention jsonb,
  p_finalize boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  queue_rows integer;
  request_rows integer;
  retention_state text;
BEGIN
  IF jsonb_typeof(p_retention) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid storage retention payload: expected an object';
  END IF;

  retention_state := p_retention->>'state';
  IF coalesce(retention_state, '') NOT IN ('purge_pending', 'purged') THEN
    RAISE EXCEPTION 'Invalid storage retention payload: state must be purge_pending or purged';
  END IF;

  IF p_finalize IS DISTINCT FROM (retention_state = 'purged') THEN
    RAISE EXCEPTION 'Storage retention finalize flag does not match the requested state';
  END IF;

  IF p_expected_url IS NULL OR btrim(p_expected_url) = '' THEN
    RAISE EXCEPTION 'Storage retention requires the exact expected playback URL';
  END IF;

  IF p_retention->>'bucket' IS DISTINCT FROM 'videos'
     OR nullif(btrim(p_retention->>'path'), '') IS NULL THEN
    RAISE EXCEPTION 'Storage retention requires a managed videos-bucket path';
  END IF;

  UPDATE public.social_publish_queue
  SET
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object('storageRetention', p_retention),
    updated_at = now()
  WHERE id = p_queue_id
    AND content_id = p_request_id::text
    AND status = 'published'
    AND video_url = p_expected_url
    AND (
      NOT p_finalize
      OR (
        metadata->'storageRetention'->>'state' = 'purge_pending'
        AND metadata->'storageRetention'->>'path' = p_retention->>'path'
      )
    );

  GET DIAGNOSTICS queue_rows = ROW_COUNT;
  IF queue_rows <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one published social queue row linked to the video request; updated %', queue_rows;
  END IF;

  UPDATE public.video_generation_requests
  SET
    content = coalesce(content, '{}'::jsonb)
      || jsonb_build_object('storageRetention', p_retention),
    updated_at = now()
  WHERE id = p_request_id
    AND status = 'completed'
    AND video_url = p_expected_url
    AND (
      NOT p_finalize
      OR (
        content->'storageRetention'->>'state' = 'purge_pending'
        AND content->'storageRetention'->>'path' = p_retention->>'path'
      )
    );

  GET DIAGNOSTICS request_rows = ROW_COUNT;
  IF request_rows <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one completed video generation row; updated %', request_rows;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_video_storage_retention(uuid, uuid, text, jsonb, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_video_storage_retention(uuid, uuid, text, jsonb, boolean)
  TO service_role;

COMMENT ON FUNCTION public.update_video_storage_retention(uuid, uuid, text, jsonb, boolean)
  IS 'Atomically records or finalizes a video Storage-retention operation for a published queue row linked to its completed video request. The Cloudinary playback URL remains intact; only the Supabase staging object is removed through the Storage API.';

-- The destructive cleanup worker calls this read-only contract check before any
-- apply. A missing migration or a regression to the old URL-clearing body fails closed.
CREATE OR REPLACE FUNCTION public.video_storage_retention_contract_ready()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  definition text;
  executable_definition text;
  queue_update text[];
  request_update text[];
BEGIN
  definition := pg_catalog.pg_get_functiondef(
    'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)'::regprocedure
  );

  -- Ignore SQL comments when validating executable statements. A comment may
  -- mention a DML keyword without introducing another database operation.
  executable_definition := pg_catalog.regexp_replace(
    definition,
    '--[^\r\n]*|/\*.*?\*/',
    '',
    'gis'
  );

  -- Parse both UPDATE statements. The preflight must inspect their SET and
  -- WHERE clauses independently; merely rejecting one known old SQL string is
  -- not sufficient to prove that a future implementation preserves playback.
  queue_update := pg_catalog.regexp_match(
    executable_definition,
    'UPDATE\s+public\.social_publish_queue\s+SET(.*?)WHERE(.*?);',
    'is'
  );
  request_update := pg_catalog.regexp_match(
    executable_definition,
    'UPDATE\s+public\.video_generation_requests\s+SET(.*?)WHERE(.*?);',
    'is'
  );

  IF queue_update IS NULL OR request_update IS NULL THEN
    RETURN false;
  END IF;

  RETURN
    -- Reject any additional UPDATE, even when the two expected tables are still updated safely.
    pg_catalog.regexp_count(executable_definition, '\mUPDATE\M', 1, 'i') = 2
    AND pg_catalog.regexp_count(definition, '\mUPDATE\s+public\.social_publish_queue\s+SET', 1, 'i') = 1
    AND pg_catalog.regexp_count(definition, '\mUPDATE\s+public\.video_generation_requests\s+SET', 1, 'i') = 1
    AND pg_catalog.regexp_count(
      executable_definition,
      '\mINSERT\M|\mMERGE\M|\mDELETE\M|\mTRUNCATE\M|\mEXECUTE\M|\mCALL\M|\mPERFORM\M|\mSELECT\M|\mCOPY\M',
      1,
      'i'
    ) = 0
    AND queue_update[1] ~* '\mmetadata\M\s*='
    AND queue_update[1] !~* '\mvideo_url\M\s*='
    AND pg_catalog.regexp_count(queue_update[1], '(^|,)\s*[a-z_]+\s*=', 1, 'i') = 2
    AND queue_update[1] ~* ',\s*updated_at\s*=\s*now\(\)\s*$'
    AND queue_update[2] ~* '\mid\M\s*=\s*p_queue_id'
    AND queue_update[2] ~* '\mcontent_id\M\s*=\s*p_request_id::text'
    AND queue_update[2] ~* '\mstatus\M\s*=\s*''published'''
    AND queue_update[2] ~* '\mvideo_url\M\s*=\s*p_expected_url'
    AND queue_update[2] !~* '\mvideo_url\M\s+IS\s+NULL'
    AND queue_update[2] ~* 'metadata->''storageRetention''->>''path''\s*=\s*p_retention->>''path'''
    AND request_update[1] ~* '\mcontent\M\s*='
    AND request_update[1] !~* '\mvideo_url\M\s*='
    AND pg_catalog.regexp_count(request_update[1], '(^|,)\s*[a-z_]+\s*=', 1, 'i') = 2
    AND request_update[1] ~* ',\s*updated_at\s*=\s*now\(\)\s*$'
    AND request_update[2] ~* '\mid\M\s*=\s*p_request_id'
    AND request_update[2] ~* '\mstatus\M\s*=\s*''completed'''
    AND request_update[2] ~* '\mvideo_url\M\s*=\s*p_expected_url'
    AND request_update[2] !~* '\mvideo_url\M\s+IS\s+NULL'
    AND request_update[2] ~* 'content->''storageRetention''->>''path''\s*=\s*p_retention->>''path'''
    AND EXISTS (
      SELECT 1
      FROM pg_catalog.pg_proc AS retention_proc
      WHERE retention_proc.oid =
        'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)'::regprocedure
        AND retention_proc.prosecdef IS FALSE
    )
    AND executable_definition ~* $pattern$SET\s+search_path\s+(?:=|TO)\s*''$pattern$
    AND executable_definition ~* $pattern$coalesce\(retention_state,\s*''\)\s+NOT\s+IN\s*\('purge_pending',\s*'purged'\)$pattern$
    AND executable_definition ~* $pattern$p_finalize\s+IS\s+DISTINCT\s+FROM\s*\(retention_state\s*=\s*'purged'\)$pattern$
    AND executable_definition ~* $pattern$nullif\(btrim\(p_retention->>'path'\),\s*''\)\s+IS\s+NULL$pattern$
    AND executable_definition ~* $pattern$p_expected_url\s+IS\s+NULL$pattern$
    AND executable_definition ~* $pattern$btrim\(p_expected_url\)\s*=\s*''$pattern$
    AND executable_definition ~* $pattern$p_retention->>'bucket'\s+IS\s+DISTINCT\s+FROM\s+'videos'$pattern$
    AND NOT pg_catalog.has_function_privilege(
      'anon',
      'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)',
      'EXECUTE'
    )
    AND NOT pg_catalog.has_function_privilege(
      'authenticated',
      'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)',
      'EXECUTE'
    )
    AND pg_catalog.has_function_privilege(
      'service_role',
      'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)',
      'EXECUTE'
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.video_storage_retention_contract_ready()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_storage_retention_contract_ready()
  TO service_role;

COMMENT ON FUNCTION public.video_storage_retention_contract_ready() IS
  'Returns true only when the active retention RPC has exactly two fenced metadata/content updates and no playback-URL assignment; the cleanup script requires this preflight before any apply.';

COMMIT;
