-- Keep social queue target lists aligned with the three provider adapters.
-- The publisher also validates legacy/runtime rows before any provider call.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.social_publish_queue'::regclass
      AND conname = 'social_publish_queue_target_platforms_check'
  ) THEN
    ALTER TABLE public.social_publish_queue
      ADD CONSTRAINT social_publish_queue_target_platforms_check
      CHECK (
        CASE
          WHEN array_ndims(target_platforms) = 1
            AND array_lower(target_platforms, 1) = 1
            AND cardinality(target_platforms) BETWEEN 1 AND 3
          THEN
            array_position(target_platforms, NULL::text) IS NULL
            AND target_platforms <@ ARRAY['facebook', 'facebook_reels', 'youtube']::text[]
            AND (cardinality(target_platforms) < 2 OR target_platforms[1] <> target_platforms[2])
            AND (
              cardinality(target_platforms) < 3
              OR (
                target_platforms[1] <> target_platforms[3]
                AND target_platforms[2] <> target_platforms[3]
              )
            )
          ELSE false
        END
      ) NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.social_publish_queue
  VALIDATE CONSTRAINT social_publish_queue_target_platforms_check;
