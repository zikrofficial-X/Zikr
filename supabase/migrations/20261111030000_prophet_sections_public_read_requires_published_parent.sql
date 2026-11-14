BEGIN;

ALTER TABLE public.prophet_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_public_read ON public.prophet_sections;
DROP POLICY IF EXISTS prophet_sections_public_read ON public.prophet_sections;
DROP POLICY IF EXISTS admin_all_prophet_sections_select ON public.prophet_sections;

CREATE POLICY prophet_sections_public_read
  ON public.prophet_sections
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.prophets AS prophet
      WHERE prophet.id = prophet_sections.prophet_id
        AND prophet.published IS TRUE
    )
  );

CREATE POLICY admin_all_prophet_sections_select
  ON public.prophet_sections
  FOR SELECT
  TO authenticated
  USING (private.is_admin_user());

COMMENT ON POLICY prophet_sections_public_read ON public.prophet_sections
  IS 'Public clients can read sections only when the parent prophet is published.';

COMMIT;
