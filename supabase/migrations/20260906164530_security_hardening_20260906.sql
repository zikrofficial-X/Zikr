BEGIN;

-- The trigger function is invoked by PostgreSQL, not by direct RPC calls.
REVOKE ALL ON FUNCTION public.prevent_admin_audit_events_mutation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_admin_audit_events_mutation() FROM anon, authenticated;

-- Keep the admin-only policy initplan-safe.
DROP POLICY IF EXISTS admin_audit_events_admin_select ON public.admin_audit_events;
CREATE POLICY admin_audit_events_admin_select
  ON public.admin_audit_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'::public.role
    )
  );

-- Remove exact duplicate indexes while keeping canonical indexes.
DROP INDEX IF EXISTS public.idx_admin_audit_events_action;
DROP INDEX IF EXISTS public.idx_admin_audit_events_created_at;
DROP INDEX IF EXISTS public.idx_admin_audit_events_resource;

COMMIT;
