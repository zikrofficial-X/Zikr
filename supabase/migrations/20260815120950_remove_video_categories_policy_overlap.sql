-- Remove the legacy duplicate UPDATE policy left alongside the command-specific admin policy.
-- The retained policy has the same admin predicate and preserves authorization.
DROP POLICY IF EXISTS update_video_categories ON public.video_categories;
