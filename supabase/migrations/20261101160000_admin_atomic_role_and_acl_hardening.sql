-- Harden the public schema's DDL-level table privileges and make role changes atomic.
-- Applied as a normal forward migration; no application rows are deleted or rewritten.
BEGIN;

-- RLS does not protect TRUNCATE. REFERENCES and TRIGGER are DDL privileges and
-- are not required by browser/server runtime requests using ordinary DML.
REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public
  FROM PUBLIC, anon, authenticated;

-- Future tables created by the Supabase migration owner must not inherit these
-- DDL-level privileges for public client roles.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES
  FROM PUBLIC, anon, authenticated;

-- A content item may have only one active (queued or processing) publication job.
-- Fail closed if historic duplicate active rows exist; do not delete or merge them.
DO $queue_invariant$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.content_publish_queue
    WHERE status IN ('queued', 'processing')
    GROUP BY content_table, content_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create the active content schedule invariant: duplicate queued/processing jobs exist';
  END IF;
END;
$queue_invariant$;

CREATE UNIQUE INDEX IF NOT EXISTS content_publish_queue_one_active_item_idx
  ON public.content_publish_queue (content_table, content_id)
  WHERE status IN ('queued', 'processing');

-- Role assignment, profile compatibility role, and audit event are committed
-- together. The function is callable only by the server's service_role client;
-- the authenticated actor is resolved from the database, not trusted from UI data.
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_next_role text,
  p_request_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor_role text;
  v_previous_role text;
  v_now timestamptz := now();
  v_request_id text := COALESCE(NULLIF(btrim(p_request_id), ''), gen_random_uuid()::text);
  v_profile_role public.role;
BEGIN
  IF p_actor_user_id IS NULL OR p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor and target user IDs are required' USING ERRCODE = '22023';
  END IF;

  IF p_next_role IS NULL OR p_next_role NOT IN (
    'user', 'admin', 'super_admin', 'content_manager', 'editor',
    'video_manager', 'social_manager', 'moderator', 'seo_manager',
    'analyst', 'support'
  ) THEN
    RAISE EXCEPTION 'Invalid administrator role' USING ERRCODE = '22023';
  END IF;

  -- Acquire stable locks before resolving roles or making any change.
  PERFORM 1 FROM public.profiles WHERE id = p_actor_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Administrative actor profile not found' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.admin_role_assignments WHERE user_id = p_actor_user_id FOR UPDATE;

  SELECT CASE
    WHEN p.role::text IS DISTINCT FROM 'admin' THEN 'user'
    WHEN a.role IS NOT NULL THEN a.role
    ELSE 'admin'
  END
  INTO v_actor_role
  FROM public.profiles AS p
  LEFT JOIN public.admin_role_assignments AS a ON a.user_id = p.id
  WHERE p.id = p_actor_user_id;

  IF v_actor_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Actor is not permitted to manage administrator roles' USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.profiles WHERE id = p_target_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found' USING ERRCODE = 'P0002';
  END IF;
  PERFORM 1 FROM public.admin_role_assignments WHERE user_id = p_target_user_id FOR UPDATE;

  SELECT CASE
    WHEN p.role::text IS DISTINCT FROM 'admin' THEN 'user'
    WHEN a.role IS NOT NULL THEN a.role
    ELSE 'admin'
  END
  INTO v_previous_role
  FROM public.profiles AS p
  LEFT JOIN public.admin_role_assignments AS a ON a.user_id = p.id
  WHERE p.id = p_target_user_id;

  IF p_actor_user_id = p_target_user_id AND p_next_role IS DISTINCT FROM v_actor_role THEN
    RAISE EXCEPTION 'An administrator cannot change their own effective role' USING ERRCODE = '42501';
  END IF;

  IF v_actor_role <> 'super_admin' THEN
    IF v_previous_role IN ('admin', 'super_admin')
      OR p_next_role IN ('admin', 'super_admin') THEN
      RAISE EXCEPTION 'Only super_admin may change or grant a full administrator role' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_next_role IN ('user', 'admin') THEN
    DELETE FROM public.admin_role_assignments WHERE user_id = p_target_user_id;
  ELSE
    INSERT INTO public.admin_role_assignments (user_id, role, created_by, updated_at)
    VALUES (p_target_user_id, p_next_role, p_actor_user_id, v_now)
    ON CONFLICT (user_id) DO UPDATE
      SET role = EXCLUDED.role,
          updated_at = EXCLUDED.updated_at;
  END IF;

  v_profile_role := CASE WHEN p_next_role = 'user' THEN 'user'::public.role ELSE 'admin'::public.role END;
  UPDATE public.profiles
  SET role = v_profile_role,
      updated_at = v_now
  WHERE id = p_target_user_id;

  INSERT INTO public.admin_audit_events (
    actor_user_id, action, permission, resource_type, resource_id,
    outcome, request_id, metadata
  )
  VALUES (
    p_actor_user_id,
    'users.role.update',
    'users.roles',
    'profiles',
    p_target_user_id::text,
    'success',
    v_request_id,
    jsonb_build_object('previousRole', v_previous_role, 'nextRole', p_next_role)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', p_target_user_id,
    'previous_role', v_previous_role,
    'next_role', p_next_role,
    'request_id', v_request_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_update_user_role(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, uuid, text, text)
  TO service_role;

COMMENT ON FUNCTION public.admin_update_user_role(uuid, uuid, text, text) IS
  'Service-only transactional administrator role update; synchronizes profile role, role assignment and immutable audit event.';

COMMIT;
