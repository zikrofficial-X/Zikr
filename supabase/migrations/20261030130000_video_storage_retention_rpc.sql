-- Atomic bookkeeping for Storage retention.
-- Storage blobs are removed through the Storage API; this function only updates
-- the two public records after the caller has passed its retention checks.

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
BEGIN
  IF jsonb_typeof(p_retention) IS DISTINCT FROM 'object'
     OR p_retention->>'state' NOT IN ('purge_pending', 'purged') THEN
    RAISE EXCEPTION 'Invalid storage retention payload';
  END IF;

  UPDATE public.social_publish_queue
  SET
    video_url = CASE WHEN p_finalize THEN NULL ELSE video_url END,
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object('storageRetention', p_retention),
    updated_at = now()
  WHERE id = p_queue_id
    AND status = 'published'
    AND (
      video_url = p_expected_url
      OR (
        p_finalize
        AND video_url IS NULL
        AND metadata->'storageRetention'->>'state' = 'purge_pending'
      )
    );

  GET DIAGNOSTICS queue_rows = ROW_COUNT;
  IF queue_rows <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one published social queue row; updated %', queue_rows;
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
  IS 'Atomically records or finalizes a video Storage-retention operation for an already-published video. Storage object deletion must use the Supabase Storage API.';

COMMIT;
