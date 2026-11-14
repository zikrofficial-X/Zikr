\set ON_ERROR_STOP on

CREATE TABLE public.social_publish_queue (
  target_platforms text[] NOT NULL DEFAULT ARRAY[]::text[]
);

\i /workspace/supabase/migrations/20261114010000_social_publish_queue_target_platform_contract.sql

INSERT INTO public.social_publish_queue (target_platforms)
VALUES
  (ARRAY['facebook']::text[]),
  (ARRAY['facebook_reels', 'youtube']::text[]),
  (ARRAY['facebook', 'facebook_reels', 'youtube']::text[]);

DO $$
BEGIN
  BEGIN
    INSERT INTO public.social_publish_queue DEFAULT VALUES;
    RAISE EXCEPTION 'Expected an empty target list to violate the queue target contract.';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.social_publish_queue (target_platforms) VALUES (ARRAY['facebook', 'instagram']::text[]);
    RAISE EXCEPTION 'Expected an unsupported target to violate the queue target contract.';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.social_publish_queue (target_platforms) VALUES (ARRAY['facebook', 'facebook']::text[]);
    RAISE EXCEPTION 'Expected a duplicate target to violate the queue target contract.';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.social_publish_queue (target_platforms) VALUES (ARRAY['facebook', NULL]::text[]);
    RAISE EXCEPTION 'Expected a null target entry to violate the queue target contract.';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.social_publish_queue (target_platforms) VALUES (ARRAY[['facebook', 'youtube']]::text[]);
    RAISE EXCEPTION 'Expected a multidimensional target list to violate the queue target contract.';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.social_publish_queue (target_platforms) VALUES (array_fill('facebook'::text, ARRAY[1], ARRAY[0]));
    RAISE EXCEPTION 'Expected a non-canonical array lower bound to violate the queue target contract.';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END
$$;

DO $$
DECLARE
  accepted_count integer;
BEGIN
  SELECT count(*) INTO accepted_count FROM public.social_publish_queue;
  IF accepted_count <> 3 THEN
    RAISE EXCEPTION 'Expected exactly three valid social queue target rows, found %.', accepted_count;
  END IF;
END
$$;

DROP TABLE public.social_publish_queue;
