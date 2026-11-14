-- Browser sessions may read their own delegated role, but role assignments must
-- only be changed through the service-role-only atomic RPC. Direct authenticated
-- writes bypass the profile-role synchronization and immutable audit transaction.
REVOKE ALL PRIVILEGES ON TABLE public.admin_role_assignments
  FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.admin_role_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.admin_role_assignments TO service_role;

DROP POLICY IF EXISTS admin_role_assignments_write ON public.admin_role_assignments;
DROP POLICY IF EXISTS admin_role_assignments_insert ON public.admin_role_assignments;
DROP POLICY IF EXISTS admin_role_assignments_update ON public.admin_role_assignments;
DROP POLICY IF EXISTS admin_role_assignments_delete ON public.admin_role_assignments;

COMMENT ON TABLE public.admin_role_assignments IS
  'Authenticated users may read their own role assignment; all role writes must use the service-role-only admin_update_user_role RPC.';
