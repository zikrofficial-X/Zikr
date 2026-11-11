SET ROLE service_role;
SELECT public.admin_update_user_role(
  '22222222-2222-4222-8222-222222222222',
  'content_manager',
  '11111111-1111-4111-8111-111111111111'
);
RESET ROLE;

DO $$
DECLARE
  v_profile_role text;
  v_assignment_role text;
  v_audit_count integer;
BEGIN
  SELECT role::text INTO v_profile_role
  FROM public.profiles WHERE id = '22222222-2222-4222-8222-222222222222';
  SELECT role INTO v_assignment_role
  FROM public.admin_role_assignments WHERE user_id = '22222222-2222-4222-8222-222222222222';
  SELECT count(*) INTO v_audit_count
  FROM public.admin_audit_events
  WHERE resource_id = '22222222-2222-4222-8222-222222222222'
    AND action = 'users.role.update';

  IF v_profile_role <> 'admin' OR v_assignment_role <> 'content_manager' THEN
    RAISE EXCEPTION 'profile and assignment roles did not commit together';
  END IF;
  IF v_audit_count <> 1 THEN
    RAISE EXCEPTION 'role update did not append exactly one audit event';
  END IF;
END;
$$;

-- A primary site-audio switch and its audit event commit atomically.
SET ROLE service_role;
SELECT public.admin_set_primary_site_audio_asset(
  '66666666-6666-4666-8666-666666666666',
  'adhan',
  '11111111-1111-4111-8111-111111111111'
);
RESET ROLE;

DO $$
DECLARE
  v_old_primary boolean;
  v_new_primary boolean;
  v_audit_count integer;
BEGIN
  SELECT is_primary INTO v_old_primary
  FROM public.site_audio_assets WHERE id = '55555555-5555-4555-8555-555555555555';
  SELECT is_primary INTO v_new_primary
  FROM public.site_audio_assets WHERE id = '66666666-6666-4666-8666-666666666666';
  SELECT count(*) INTO v_audit_count
  FROM public.admin_audit_events
  WHERE action = 'site_audio.primary.set'
    AND resource_id = '66666666-6666-4666-8666-666666666666';
  IF v_old_primary OR NOT v_new_primary THEN
    RAISE EXCEPTION 'primary audio switch did not update the correct asset';
  END IF;
  IF v_audit_count <> 1 THEN
    RAISE EXCEPTION 'primary audio switch did not append one audit event';
  END IF;
END;
$$;

-- A delegated role must not be able to use the service RPC to grant full admin.
SET ROLE service_role;
DO $$
BEGIN
  BEGIN
    PERFORM public.admin_update_user_role(
      '44444444-4444-4444-8444-444444444444',
      'admin',
      '33333333-3333-4333-8333-333333333333'
    );
    RAISE EXCEPTION 'delegated role unexpectedly granted full admin';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    NULL;
  END;
END;
$$;
RESET ROLE;

-- Simulate an audit write failure. The profile and assignment update must roll back.
CREATE OR REPLACE FUNCTION public.fail_selected_role_audit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.metadata ->> 'nextRole' = 'editor' THEN
    RAISE EXCEPTION 'forced role audit failure';
  END IF;
  IF NEW.action = 'site_audio.primary.set' THEN
    RAISE EXCEPTION 'forced audio audit failure';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER fail_selected_role_audit
BEFORE INSERT ON public.admin_audit_events
FOR EACH ROW EXECUTE FUNCTION public.fail_selected_role_audit();

SET ROLE service_role;
DO $$
BEGIN
  BEGIN
    PERFORM public.admin_update_user_role(
      '22222222-2222-4222-8222-222222222222',
      'editor',
      '11111111-1111-4111-8111-111111111111'
    );
    RAISE EXCEPTION 'expected audit failure was not raised';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'forced role audit failure' THEN
      RAISE;
    END IF;
  END;
END;
$$;
RESET ROLE;

DO $$
DECLARE
  v_profile_role text;
  v_assignment_role text;
  v_audit_count integer;
BEGIN
  SELECT role::text INTO v_profile_role
  FROM public.profiles WHERE id = '22222222-2222-4222-8222-222222222222';
  SELECT role INTO v_assignment_role
  FROM public.admin_role_assignments WHERE user_id = '22222222-2222-4222-8222-222222222222';
  SELECT count(*) INTO v_audit_count
  FROM public.admin_audit_events
  WHERE resource_id = '22222222-2222-4222-8222-222222222222'
    AND action = 'users.role.update';

  IF v_profile_role <> 'admin' OR v_assignment_role <> 'content_manager' THEN
    RAISE EXCEPTION 'partial role mutation survived an audit failure';
  END IF;
  IF v_audit_count <> 1 THEN
    RAISE EXCEPTION 'failed role transaction left an audit record';
  END IF;
END;
$$;

DO $$
BEGIN
  IF has_function_privilege('anon', 'public.admin_set_primary_site_audio_asset(uuid,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can execute admin_set_primary_site_audio_asset';
  END IF;
  IF has_function_privilege('authenticated', 'public.admin_set_primary_site_audio_asset(uuid,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated can execute admin_set_primary_site_audio_asset';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.admin_set_primary_site_audio_asset(uuid,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute admin_set_primary_site_audio_asset';
  END IF;
END;
$$;

DO $$
BEGIN
  IF has_function_privilege('anon', 'public.admin_update_user_role(uuid,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can execute admin_update_user_role';
  END IF;
  IF has_function_privilege('authenticated', 'public.admin_update_user_role(uuid,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated can execute admin_update_user_role';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.admin_update_user_role(uuid,text,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute admin_update_user_role';
  END IF;
END;
$$;

-- A full administrator cannot demote or otherwise change their own role.
SET ROLE service_role;
DO $$
BEGIN
  BEGIN
    PERFORM public.admin_update_user_role(
      '11111111-1111-4111-8111-111111111111',
      'admin',
      '11111111-1111-4111-8111-111111111111'
    );
    RAISE EXCEPTION 'super administrator unexpectedly changed its own role to admin';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    NULL;
  END;

  BEGIN
    PERFORM public.admin_update_user_role(
      '11111111-1111-4111-8111-111111111111',
      'user',
      '11111111-1111-4111-8111-111111111111'
    );
    RAISE EXCEPTION 'super administrator unexpectedly demoted itself to user';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    NULL;
  END;
END;
$$;
RESET ROLE;

DO $$
DECLARE
  v_profile_role text;
  v_assignment_role text;
BEGIN
  SELECT role::text INTO v_profile_role
  FROM public.profiles WHERE id = '11111111-1111-4111-8111-111111111111';
  SELECT role INTO v_assignment_role
  FROM public.admin_role_assignments WHERE user_id = '11111111-1111-4111-8111-111111111111';

  IF v_profile_role <> 'admin' OR v_assignment_role <> 'super_admin' THEN
    RAISE EXCEPTION 'self-role rejection did not preserve the super administrator assignment';
  END IF;
END;
$$;
SELECT 'ADMIN_ROLE_UPDATE_INTEGRATION_PASSED' AS result;


-- Browser roles can read delegated role metadata but cannot bypass the audited RPC.
DO $role_assignment_acl$
BEGIN
  IF NOT has_table_privilege('authenticated', 'public.admin_role_assignments', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated cannot read its delegated role assignment';
  END IF;
  IF has_table_privilege('authenticated', 'public.admin_role_assignments', 'INSERT')
     OR has_table_privilege('authenticated', 'public.admin_role_assignments', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.admin_role_assignments', 'DELETE') THEN
    RAISE EXCEPTION 'authenticated retains direct role-assignment write privileges';
  END IF;
  IF NOT has_table_privilege('service_role', 'public.admin_role_assignments', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.admin_role_assignments', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.admin_role_assignments', 'DELETE') THEN
    RAISE EXCEPTION 'service_role lost the table access required by the audited RPC';
  END IF;
END;
$role_assignment_acl$;

SET ROLE authenticated;
DO $blocked_direct_role_delete$
BEGIN
  BEGIN
    DELETE FROM public.admin_role_assignments
    WHERE user_id = '33333333-3333-4333-8333-333333333333';
    RAISE EXCEPTION 'authenticated direct role deletion unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$blocked_direct_role_delete$;
RESET ROLE;

DO $role_assignment_preserved$
DECLARE
  v_profile_role text;
  v_assignment_role text;
BEGIN
  SELECT role::text INTO v_profile_role
  FROM public.profiles
  WHERE id = '33333333-3333-4333-8333-333333333333';
  SELECT role INTO v_assignment_role
  FROM public.admin_role_assignments
  WHERE user_id = '33333333-3333-4333-8333-333333333333';
  IF v_profile_role <> 'admin' OR v_assignment_role <> 'content_manager' THEN
    RAISE EXCEPTION 'blocked direct deletion changed or promoted the delegated administrator';
  END IF;
END;
$role_assignment_preserved$;
