-- Reconciles the idempotent FK-index migration recorded in the live project history
-- by the production apply_migration operation. This is intentionally identical in effect.
CREATE INDEX IF NOT EXISTS video_template_versions_created_by_idx
  ON public.video_template_versions (created_by);

CREATE INDEX IF NOT EXISTS video_template_versions_reviewed_by_idx
  ON public.video_template_versions (reviewed_by);

CREATE INDEX IF NOT EXISTS video_template_versions_activated_by_idx
  ON public.video_template_versions (activated_by);
