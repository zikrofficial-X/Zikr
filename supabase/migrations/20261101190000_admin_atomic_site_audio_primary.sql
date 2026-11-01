-- Atomically switch the primary administrator-managed audio asset and audit it.
CREATE OR REPLACE FUNCTION public.admin_set_primary_site_audio_asset(
  p_asset_id uuid,
  p_kind text,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := now();
  v_target_id uuid;
BEGIN
  IF p_asset_id IS NULL OR p_actor_user_id IS NULL
     OR p_kind IS NULL OR p_kind NOT IN ('adhan', 'salawat', 'dhikr') THEN
    RAISE EXCEPTION 'invalid site audio target' USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.site_audio_assets
  WHERE kind = p_kind AND is_primary
  FOR UPDATE;

  SELECT id
  INTO v_target_id
  FROM public.site_audio_assets
  WHERE id = p_asset_id AND kind = p_kind
  FOR UPDATE;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'site audio asset not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.site_audio_assets
  SET is_primary = false, updated_at = v_now
  WHERE kind = p_kind AND is_primary;

  UPDATE public.site_audio_assets
  SET is_primary = true, updated_at = v_now
  WHERE id = v_target_id AND kind = p_kind;

  INSERT INTO public.admin_audit_events (
    actor_user_id, action, permission, resource_type, resource_id,
    outcome, request_id, metadata, created_at
  )
  VALUES (
    p_actor_user_id,
    'site_audio.primary.set',
    'audio.manage',
    'site_audio_assets',
    v_target_id::text,
    'success',
    gen_random_uuid()::text,
    jsonb_build_object('kind', p_kind),
    v_now
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_primary_site_audio_asset(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_primary_site_audio_asset(uuid, text, uuid)
  TO service_role;

COMMENT ON FUNCTION public.admin_set_primary_site_audio_asset(uuid, text, uuid) IS
  'Atomically changes the primary audio asset for one kind and appends the audit event.';
