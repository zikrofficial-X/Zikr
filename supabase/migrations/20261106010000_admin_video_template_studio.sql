-- Immutable, renderer-backed Video Factory template registry.
-- Built-in SVG assets are imported as version 1; later edits create new versions.
CREATE TABLE IF NOT EXISTS public.video_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 2 AND 120),
  description text NOT NULL DEFAULT '',
  audience text NOT NULL CHECK (audience IN ('general', 'kids')),
  asset_key text NOT NULL CHECK (asset_key IN (
    'calm', 'dawn', 'emerald', 'gold', 'night', 'paper', 'rose',
    'kids-garden', 'kids-nature', 'kids-neighborhood', 'kids-workshop'
  )),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.video_templates(id) ON DELETE RESTRICT,
  version integer NOT NULL CHECK (version > 0),
  config jsonb NOT NULL CHECK (jsonb_typeof(config) = 'object'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'retired')),
  is_system_seed boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  activated_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version),
  CHECK (is_system_seed OR status NOT IN ('approved', 'active', 'retired') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS video_template_versions_one_active_per_template
  ON public.video_template_versions(template_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS video_template_versions_template_version_idx
  ON public.video_template_versions(template_id, version DESC);

ALTER TABLE public.video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_template_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON public.video_templates, public.video_template_versions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.video_templates, public.video_template_versions TO service_role;

CREATE OR REPLACE FUNCTION public.prevent_video_template_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'video template versions are append-only; create a new version instead'
      USING ERRCODE = '55000';
  END IF;

  IF ROW(OLD.id, OLD.template_id, OLD.version, OLD.config, OLD.is_system_seed, OLD.created_by, OLD.created_at)
     IS DISTINCT FROM
     ROW(NEW.id, NEW.template_id, NEW.version, NEW.config, NEW.is_system_seed, NEW.created_by, NEW.created_at) THEN
    RAISE EXCEPTION 'video template version identity and config are immutable'
      USING ERRCODE = '55000';
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status AND NOT (
    (OLD.status = 'draft' AND NEW.status = 'approved') OR
    (OLD.status = 'approved' AND NEW.status = 'active') OR
    (OLD.status = 'active' AND NEW.status = 'retired') OR
    (OLD.status = 'retired' AND NEW.status = 'active')
  ) THEN
    RAISE EXCEPTION 'invalid video template version state transition'
      USING ERRCODE = '55000';
  END IF;

  IF NEW.status IN ('approved', 'active', 'retired') AND NOT NEW.is_system_seed
     AND (NEW.reviewed_by IS NULL OR NEW.reviewed_at IS NULL) THEN
    RAISE EXCEPTION 'review evidence is required before activating a template version'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'active' AND (NEW.activated_by IS NULL OR NEW.activated_at IS NULL) THEN
    RAISE EXCEPTION 'activation actor and timestamp are required'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS video_template_versions_immutable ON public.video_template_versions;
CREATE TRIGGER video_template_versions_immutable
BEFORE UPDATE OR DELETE ON public.video_template_versions
FOR EACH ROW EXECUTE FUNCTION public.prevent_video_template_version_mutation();

CREATE OR REPLACE FUNCTION public.admin_create_video_template_version(
  p_template_id uuid,
  p_config jsonb,
  p_actor_user_id uuid
)
RETURNS TABLE(id uuid, version integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_audience text;
  v_version integer;
  v_asset text;
BEGIN
  IF p_actor_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = p_actor_user_id) THEN
    RAISE EXCEPTION 'valid actor is required' USING ERRCODE = '22023';
  END IF;
  IF p_config IS NULL OR jsonb_typeof(p_config) <> 'object' THEN
    RAISE EXCEPTION 'template config must be a JSON object' USING ERRCODE = '22023';
  END IF;

  v_asset := p_config ->> 'assetKey';
  IF p_config ->> 'defaultFormat' NOT IN ('vertical', 'horizontal')
     OR p_config ->> 'motion' NOT IN ('slow', 'fade') THEN
    RAISE EXCEPTION 'unsupported template format or motion' USING ERRCODE = '22023';
  END IF;

  SELECT audience INTO v_audience
  FROM public.video_templates
  WHERE video_templates.id = p_template_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'video template not found' USING ERRCODE = 'P0002';
  END IF;

  IF (v_audience = 'kids' AND v_asset NOT IN ('kids-garden', 'kids-nature', 'kids-neighborhood', 'kids-workshop'))
     OR (v_audience = 'general' AND v_asset NOT IN ('calm', 'dawn', 'emerald', 'gold', 'night', 'paper', 'rose')) THEN
    RAISE EXCEPTION 'asset does not match template audience' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(MAX(video_template_versions.version), 0) + 1
  INTO v_version
  FROM public.video_template_versions
  WHERE video_template_versions.template_id = p_template_id;

  RETURN QUERY
  INSERT INTO public.video_template_versions AS inserted (
    template_id, version, config, status, is_system_seed, created_by
  )
  VALUES (p_template_id, v_version, p_config, 'draft', false, p_actor_user_id)
  RETURNING inserted.id, inserted.version;
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_video_template_version(
  p_version_id uuid,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_template_id uuid;
  v_status text;
  v_is_system_seed boolean;
  v_reviewed_by uuid;
  v_reviewed_at timestamptz;
BEGIN
  IF p_actor_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = p_actor_user_id) THEN
    RAISE EXCEPTION 'valid actor is required' USING ERRCODE = '22023';
  END IF;

  SELECT template_id, status, is_system_seed, reviewed_by, reviewed_at
  INTO v_template_id, v_status, v_is_system_seed, v_reviewed_by, v_reviewed_at
  FROM public.video_template_versions
  WHERE id = p_version_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'video template version not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_status NOT IN ('approved', 'retired', 'active') THEN
    RAISE EXCEPTION 'only reviewed template versions can be activated' USING ERRCODE = '55000';
  END IF;
  IF NOT v_is_system_seed AND (v_reviewed_by IS NULL OR v_reviewed_at IS NULL) THEN
    RAISE EXCEPTION 'review evidence is required before activation' USING ERRCODE = '23514';
  END IF;

  UPDATE public.video_template_versions
  SET status = 'retired'
  WHERE template_id = v_template_id
    AND status = 'active'
    AND id <> p_version_id;

  UPDATE public.video_template_versions
  SET status = 'active',
      activated_by = p_actor_user_id,
      activated_at = now()
  WHERE id = p_version_id;

  RETURN p_version_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_create_video_template_version(uuid, jsonb, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.activate_video_template_version(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_video_template_version(uuid, jsonb, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_video_template_version(uuid, uuid)
  TO service_role;

-- Import the eleven already-shipped SVG assets as immutable version-1 templates.
INSERT INTO public.video_templates (id, slug, title, description, audience, asset_key)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'calm', 'هادئ', 'تصميم هادئ للمحتوى التأملي.', 'general', 'calm'),
  ('10000000-0000-4000-8000-000000000002', 'dawn', 'الفجر', 'هوية ضوئية لمحتوى الصباح والبدايات.', 'general', 'dawn'),
  ('10000000-0000-4000-8000-000000000003', 'emerald', 'زمردي', 'هوية خضراء للمحتوى العام.', 'general', 'emerald'),
  ('10000000-0000-4000-8000-000000000004', 'gold', 'ذهبي', 'هوية ذهبية للمحتوى المميز.', 'general', 'gold'),
  ('10000000-0000-4000-8000-000000000005', 'night', 'ليلي', 'خلفية ليلية للمحتوى الهادئ.', 'general', 'night'),
  ('10000000-0000-4000-8000-000000000006', 'paper', 'ورقي', 'أسلوب ورقي للنصوص والاقتباسات.', 'general', 'paper'),
  ('10000000-0000-4000-8000-000000000007', 'rose', 'وردي', 'هوية لونية ناعمة للمحتوى المناسب.', 'general', 'rose'),
  ('10000000-0000-4000-8000-000000000008', 'kids-garden', 'حديقة الأطفال', 'قالب من مكتبة أصول الأطفال.', 'kids', 'kids-garden'),
  ('10000000-0000-4000-8000-000000000009', 'kids-nature', 'طبيعة الأطفال', 'قالب تعليمي بطابع الطبيعة.', 'kids', 'kids-nature'),
  ('10000000-0000-4000-8000-000000000010', 'kids-neighborhood', 'حيّ الأطفال', 'قالب قصصي لعالم الطفل اليومي.', 'kids', 'kids-neighborhood'),
  ('10000000-0000-4000-8000-000000000011', 'kids-workshop', 'ورشة الأطفال', 'قالب تعليمي تفاعلي للأطفال.', 'kids', 'kids-workshop')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.video_template_versions (
  template_id, version, config, status, is_system_seed
)
SELECT
  template.id,
  1,
  jsonb_build_object(
    'assetKey', template.asset_key,
    'defaultFormat', 'vertical',
    'motion', 'slow'
  ),
  'active',
  true
FROM public.video_templates AS template
ON CONFLICT (template_id, version) DO NOTHING;

COMMENT ON TABLE public.video_template_versions IS
  'Append-only, reviewed FFmpeg/SVG template configuration snapshots. New edits require new versions; rollback reactivates a retired version.';
COMMENT ON FUNCTION public.activate_video_template_version(uuid, uuid) IS
  'Atomically activates a reviewed immutable template version and retires its previous active version; service-role only.';
