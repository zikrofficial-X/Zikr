-- Add B-tree support for the actor foreign keys introduced by the Admin Template Studio.
-- These indexes are additive and do not change row visibility or template version semantics.
CREATE INDEX IF NOT EXISTS video_template_versions_created_by_idx
  ON public.video_template_versions (created_by);

CREATE INDEX IF NOT EXISTS video_template_versions_reviewed_by_idx
  ON public.video_template_versions (reviewed_by);

CREATE INDEX IF NOT EXISTS video_template_versions_activated_by_idx
  ON public.video_template_versions (activated_by);
