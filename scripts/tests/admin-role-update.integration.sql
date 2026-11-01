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
    RAISE EXCEPTION 'forced audit failure';
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
    IF SQLERRM <> 'forced audit failure' THEN
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

SELECT 'ADMIN_ROLE_UPDATE_INTEGRATION_PASSED' AS result;
