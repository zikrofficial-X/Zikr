-- Align database-level administrator checks with the application's assigned roles.
-- Legacy profiles.role = 'admin' rows without an assignment remain full admins.
-- Delegated roles are evaluated explicitly by the policies that grant their scope.

CREATE OR REPLACE FUNCTION private.current_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT CASE
    WHEN p.role::text IS DISTINCT FROM 'admin' THEN 'user'
    WHEN assignment.role IS NOT NULL THEN assignment.role
    ELSE 'admin'
  END
  FROM public.profiles AS p
  LEFT JOIN public.admin_role_assignments AS assignment
    ON assignment.user_id = p.id
  WHERE p.id = (SELECT auth.uid())
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION private.has_admin_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(
    (SELECT private.current_admin_role()) = ANY(COALESCE(required_roles, ARRAY[]::text[])),
    false
  );
$function$;

-- Only a legacy full admin or an explicitly assigned super_admin is a global RLS admin.
CREATE OR REPLACE FUNCTION private.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT private.has_admin_role(ARRAY['admin', 'super_admin']::text[]);
$function$;

-- Keep the exposed compatibility wrapper consistent with the private predicate.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $function$
  SELECT private.is_admin_user();
$function$;

REVOKE ALL ON FUNCTION private.current_admin_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_admin_role(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;

GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_admin_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_admin_role(text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin_user() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon, authenticated, service_role;

-- A user may read their own assignment. Only full admins may inspect or mutate
-- other users' role assignments; delegated roles cannot promote themselves.
DROP POLICY IF EXISTS admin_role_assignments_select ON public.admin_role_assignments;
CREATE POLICY admin_role_assignments_select
  ON public.admin_role_assignments
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT private.has_admin_role(ARRAY['admin', 'super_admin']::text[]))
  );

DROP POLICY IF EXISTS admin_role_assignments_insert ON public.admin_role_assignments;
CREATE POLICY admin_role_assignments_insert
  ON public.admin_role_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.has_admin_role(ARRAY['admin', 'super_admin']::text[]))
    AND (
      role <> 'super_admin'
      OR (SELECT private.has_admin_role(ARRAY['super_admin']::text[]))
    )
  );

DROP POLICY IF EXISTS admin_role_assignments_update ON public.admin_role_assignments;
CREATE POLICY admin_role_assignments_update
  ON public.admin_role_assignments
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.has_admin_role(ARRAY['admin', 'super_admin']::text[]))
    AND (
      role <> 'super_admin'
      OR (SELECT private.has_admin_role(ARRAY['super_admin']::text[]))
    )
  )
  WITH CHECK (
    (SELECT private.has_admin_role(ARRAY['admin', 'super_admin']::text[]))
    AND (
      role <> 'super_admin'
      OR (SELECT private.has_admin_role(ARRAY['super_admin']::text[]))
    )
  );

DROP POLICY IF EXISTS admin_role_assignments_delete ON public.admin_role_assignments;
CREATE POLICY admin_role_assignments_delete
  ON public.admin_role_assignments
  FOR DELETE TO authenticated
  USING (
    (SELECT private.has_admin_role(ARRAY['admin', 'super_admin']::text[]))
    AND (
      role <> 'super_admin'
      OR (SELECT private.has_admin_role(ARRAY['super_admin']::text[]))
    )
  );

-- Audit access mirrors roles that actually carry the audit.read permission.
DROP POLICY IF EXISTS admin_audit_events_admin_select ON public.admin_audit_events;
CREATE POLICY admin_audit_events_admin_select
  ON public.admin_audit_events
  FOR SELECT TO authenticated
  USING (
    (SELECT private.has_admin_role(ARRAY[
      'admin', 'super_admin', 'content_manager', 'video_manager',
      'social_manager', 'moderator', 'seo_manager', 'analyst'
    ]::text[]))
  );

-- Queue-alert history is visible only to full admins and roles with notifications.manage.
DROP POLICY IF EXISTS admin_queue_alert_deliveries_admin_read ON public.admin_queue_alert_deliveries;
CREATE POLICY admin_queue_alert_deliveries_admin_read
  ON public.admin_queue_alert_deliveries
  FOR SELECT TO authenticated
  USING (
    (SELECT private.has_admin_role(ARRAY[
      'admin', 'super_admin', 'social_manager', 'support'
    ]::text[]))
  );

-- Social queue mutations are limited to admins and the social_manager role.
DROP POLICY IF EXISTS social_publish_queue_admin_write ON public.social_publish_queue;
CREATE POLICY social_publish_queue_admin_write
  ON public.social_publish_queue
  FOR ALL TO authenticated
  USING (
    (SELECT private.has_admin_role(ARRAY[
      'admin', 'super_admin', 'social_manager'
    ]::text[]))
  )
  WITH CHECK (
    (SELECT private.has_admin_role(ARRAY[
      'admin', 'super_admin', 'social_manager'
    ]::text[]))
  );

COMMENT ON FUNCTION private.current_admin_role() IS
  'Resolves the authenticated user role without elevating delegated admin assignments.';
COMMENT ON FUNCTION private.has_admin_role(text[]) IS
  'Checks the resolved administrator role against an explicit allowed-role list.';
COMMENT ON FUNCTION private.is_admin_user() IS
  'Global database administrator predicate; true only for legacy admin or super_admin.';
