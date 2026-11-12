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
