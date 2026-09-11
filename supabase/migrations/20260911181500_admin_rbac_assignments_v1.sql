CREATE TABLE IF NOT EXISTS public.admin_role_assignments (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin','content_manager','editor','video_manager','social_manager','moderator','seo_manager','analyst','support')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_role_assignments_role_idx ON public.admin_role_assignments(role);

ALTER TABLE public.admin_role_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_role_assignments_select ON public.admin_role_assignments;
CREATE POLICY admin_role_assignments_select
  ON public.admin_role_assignments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS admin_role_assignments_write ON public.admin_role_assignments;
CREATE POLICY admin_role_assignments_write
  ON public.admin_role_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

INSERT INTO public.admin_role_assignments (user_id, role)
SELECT id, 'super_admin'
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;
