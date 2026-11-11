-- Atomically update the legacy profile role, delegated role assignment, and audit event.
-- The function is callable only by the server service role. The server action performs
-- session, permission, target-role and MFA checks before invoking this RPC.
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_user_id uuid,
  p_role text,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_actor_role text;
  v_target_profile_role text;
  v_target_assigned_role text;
  v_previous_role text;
  v_now timestamptz := now();
  v_allowed_roles text[] := ARRAY[
    'user', 'admin', 'super_admin', 'content_manager', 'editor',
    'video_manager', 'social_manager', 'moderator', 'seo_manager',
    'analyst', 'support'
  ];
BEGIN
  IF p_user_id IS NULL OR p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'user and actor IDs are required' USING ERRCODE = '22023';
  END IF;
  IF p_role IS NULL OR NOT (p_role = ANY(v_allowed_roles)) THEN
    RAISE EXCEPTION 'invalid administrator role' USING ERRCODE = '22023';
  END IF;

  SELECT
    CASE
      WHEN profile.role::text IS DISTINCT FROM 'admin' THEN 'user'
      WHEN assignment.role IS NOT NULL THEN assignment.role
      ELSE 'admin'
    END
  INTO v_actor_role
  FROM public.profiles AS profile
  LEFT JOIN public.admin_role_assignments AS assignment
    ON assignment.user_id = profile.id
  WHERE profile.id = p_actor_user_id;

  IF v_actor_role IS NULL OR v_actor_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'actor is not a full administrator' USING ERRCODE = '42501';
  END IF;

  SELECT profile.role::text
  INTO v_target_profile_role
  FROM public.profiles AS profile
  WHERE profile.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'target user does not exist' USING ERRCODE = 'P0002';
  END IF;

  SELECT assignment.role
  INTO v_target_assigned_role
  FROM public.admin_role_assignments AS assignment
  WHERE assignment.user_id = p_user_id
  FOR UPDATE;

  v_previous_role := COALESCE(
    v_target_assigned_role,
    CASE WHEN v_target_profile_role = 'admin' THEN 'admin' ELSE 'user' END
  );

  IF p_user_id = p_actor_user_id AND p_role <> v_previous_role THEN
    RAISE EXCEPTION 'self-role changes are not allowed through this action' USING ERRCODE = '42501';
  END IF;

  IF v_actor_role <> 'super_admin' AND (
    v_previous_role IN ('admin', 'super_admin')
    OR (p_role IN ('admin', 'super_admin') AND p_user_id <> p_actor_user_id)
  ) THEN
    RAISE EXCEPTION 'only a super administrator may manage full-admin accounts' USING ERRCODE = '42501';
  END IF;

  IF p_role IN ('user', 'admin') THEN
    DELETE FROM public.admin_role_assignments
    WHERE user_id = p_user_id;
  ELSE
    INSERT INTO public.admin_role_assignments (
      user_id, role, created_by, updated_at
    )
    VALUES (p_user_id, p_role, p_actor_user_id, v_now)
    ON CONFLICT (user_id) DO UPDATE
      SET role = EXCLUDED.role,
          created_by = EXCLUDED.created_by,
          updated_at = EXCLUDED.updated_at;
  END IF;

  UPDATE public.profiles
  SET role = CASE
      WHEN p_role = 'user' THEN 'user'::public.role
      ELSE 'admin'::public.role
    END,
    updated_at = v_now
  WHERE id = p_user_id;

  INSERT INTO public.admin_audit_events (
    actor_user_id, action, permission, resource_type, resource_id,
    outcome, request_id, metadata, created_at
  )
  VALUES (
    p_actor_user_id,
    'users.role.update',
    'users.roles',
    'profiles',
    p_user_id::text,
    'success',
    gen_random_uuid()::text,
    jsonb_build_object(
      'previousRole', v_previous_role,
      'nextRole', p_role,
      'actor', p_actor_user_id
    ),
    v_now
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_update_user_role(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, text, uuid)
  TO service_role;

COMMENT ON FUNCTION public.admin_update_user_role(uuid, text, uuid) IS
  'Atomically updates a user admin role and appends its audit event; service-role only; actors cannot change their own role.';
