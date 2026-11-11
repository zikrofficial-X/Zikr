-- Harden the service-only video retention bookkeeping RPC.
-- The cleanup worker must prove the queue/request relationship and use matching
-- pending/final states before the public playback master can be left untouched
-- while only the redundant Supabase staging copy is removed.

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
    video_url = CASE WHEN p_finalize THEN NULL ELSE video_url END,
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
    video_url = CASE WHEN p_finalize THEN NULL ELSE video_url END,
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
  IS 'Atomically records or finalizes a video Storage-retention operation for a published queue row linked to its completed video request. Storage object deletion must use the Supabase Storage API.';

COMMIT;
