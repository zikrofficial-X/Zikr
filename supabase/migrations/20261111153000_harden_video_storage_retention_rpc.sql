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
    AND (
      video_url = p_expected_url
      OR (
        p_finalize
        AND video_url IS NULL
        AND metadata->'storageRetention'->>'state' = 'purge_pending'
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
    AND (
      video_url = p_expected_url
      OR (
        p_finalize
        AND video_url IS NULL
        AND content->'storageRetention'->>'state' = 'purge_pending'
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
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT NOT (
    pg_catalog.lower(
      pg_catalog.pg_get_functiondef(
        'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)'::regprocedure
      )
    ) ~ 'video_url\s*=\s*case\s+when\s+p_finalize\s+then\s+null'
  );
$function$;

REVOKE ALL ON FUNCTION public.video_storage_retention_contract_ready()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.video_storage_retention_contract_ready()
  TO service_role;

COMMENT ON FUNCTION public.video_storage_retention_contract_ready() IS
  'Returns true only when the active retention RPC preserves Cloudinary playback URLs; the cleanup script requires this preflight before any apply.';

COMMIT;
