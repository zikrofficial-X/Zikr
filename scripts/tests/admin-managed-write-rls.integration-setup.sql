DO $roles$
BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

DO $roles$
BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

DO $roles$
BEGIN
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS storage;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT true;
$function$;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

CREATE OR REPLACE FUNCTION private.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT true;
$function$;
GRANT EXECUTE ON FUNCTION private.is_admin_user() TO authenticated;

CREATE OR REPLACE FUNCTION private.has_admin_role(p_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT true;
$function$;
GRANT EXECUTE ON FUNCTION private.has_admin_role(text[]) TO authenticated;

CREATE TABLE public.social_publish_queue (
  id uuid PRIMARY KEY,
  status text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE public.video_generation_requests (
  id uuid PRIMARY KEY,
  status text NOT NULL,
  title text NOT NULL
);
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY,
  published boolean NOT NULL DEFAULT false,
  verified_rights boolean,
  rights_verified boolean,
  url text
);
CREATE TABLE public.site_audio_assets (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  storage_path text NOT NULL
);
CREATE TABLE public.videos (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  published boolean NOT NULL DEFAULT false
);

CREATE TABLE public.kids_content (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  type text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE storage.objects (
  id bigint PRIMARY KEY,
  bucket_id text NOT NULL,
  name text NOT NULL
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY site_audio_public_read
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-audio');
CREATE POLICY site_audio_admin_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-audio' AND private.is_admin_user());
CREATE POLICY site_audio_admin_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-audio' AND private.is_admin_user());
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.objects TO anon, authenticated, service_role;

ALTER TABLE public.social_publish_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_audio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_publish_queue_admin_read
  ON public.social_publish_queue
  FOR SELECT TO authenticated
  USING (private.has_admin_role(ARRAY['admin'::text, 'super_admin'::text, 'social_manager'::text]));

CREATE POLICY social_publish_queue_admin_write
  ON public.social_publish_queue
  FOR ALL TO authenticated
  USING (private.has_admin_role(ARRAY['admin'::text, 'super_admin'::text, 'social_manager'::text]))
  WITH CHECK (private.has_admin_role(ARRAY['admin'::text, 'super_admin'::text, 'social_manager'::text]));

CREATE POLICY social_publish_queue_admin_all
  ON public.social_publish_queue
  FOR ALL TO authenticated
  USING (private.has_admin_role(ARRAY['admin'::text, 'super_admin'::text, 'social_manager'::text]))
  WITH CHECK (private.has_admin_role(ARRAY['admin'::text, 'super_admin'::text, 'social_manager'::text]));

CREATE POLICY social_publish_queue_service_role_all
  ON public.social_publish_queue
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY social_publish_queue_admin_insert
  ON public.social_publish_queue
  FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_role(ARRAY['admin'::text, 'super_admin'::text, 'social_manager'::text]));

CREATE POLICY social_publish_queue_admin_update
  ON public.social_publish_queue
  FOR UPDATE TO authenticated
  USING (private.has_admin_role(ARRAY['admin'::text, 'super_admin'::text, 'social_manager'::text]))
  WITH CHECK (private.has_admin_role(ARRAY['admin'::text, 'super_admin'::text, 'social_manager'::text]));

CREATE POLICY social_publish_queue_admin_delete
  ON public.social_publish_queue
  FOR DELETE TO authenticated
  USING (private.has_admin_role(ARRAY['admin'::text, 'super_admin'::text, 'social_manager'::text]));

CREATE POLICY social_publish_queue_authenticated_read_published_or_admin
  ON public.social_publish_queue
  FOR SELECT TO authenticated
  USING (status = 'published' OR private.has_admin_role(ARRAY['admin'::text, 'super_admin'::text, 'social_manager'::text]));

CREATE POLICY select_video_requests_admin
  ON public.video_generation_requests
  FOR SELECT TO authenticated
  USING (private.is_admin_user());

CREATE POLICY insert_video_requests_admin
  ON public.video_generation_requests
  FOR INSERT TO authenticated
  WITH CHECK (private.is_admin_user());

CREATE POLICY update_video_requests_admin
  ON public.video_generation_requests
  FOR UPDATE TO authenticated
  USING (private.is_admin_user())
  WITH CHECK (private.is_admin_user());

CREATE POLICY media_assets_admin_all
  ON public.media_assets
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY media_assets_admin_select
  ON public.media_assets
  FOR SELECT TO authenticated
  USING (private.is_admin_user());

CREATE POLICY media_assets_admin_insert
  ON public.media_assets
  FOR INSERT TO authenticated
  WITH CHECK (private.is_admin_user());

CREATE POLICY media_assets_admin_update
  ON public.media_assets
  FOR UPDATE TO authenticated
  USING (private.is_admin_user())
  WITH CHECK (private.is_admin_user());

CREATE POLICY media_assets_admin_delete
  ON public.media_assets
  FOR DELETE TO authenticated
  USING (private.is_admin_user());

CREATE POLICY media_assets_public_read
  ON public.media_assets
  FOR SELECT TO anon
  USING (
    published IS TRUE
    AND COALESCE(verified_rights, rights_verified, false) IS TRUE
  );

CREATE POLICY site_audio_assets_admin_insert
  ON public.site_audio_assets
  FOR INSERT TO authenticated
  WITH CHECK (private.is_admin_user());

CREATE POLICY site_audio_assets_admin_update
  ON public.site_audio_assets
  FOR UPDATE TO authenticated
  USING (private.is_admin_user())
  WITH CHECK (private.is_admin_user());

CREATE POLICY site_audio_assets_admin_delete
  ON public.site_audio_assets
  FOR DELETE TO authenticated
  USING (private.is_admin_user());

CREATE POLICY admin_all_videos_insert
  ON public.videos
  FOR INSERT TO authenticated
  WITH CHECK (private.is_admin_user());

CREATE POLICY admin_all_videos_update
  ON public.videos
  FOR UPDATE TO authenticated
  USING (private.is_admin_user())
  WITH CHECK (private.is_admin_user());

CREATE POLICY admin_all_videos_delete
  ON public.videos
  FOR DELETE TO authenticated
  USING (private.is_admin_user());

CREATE POLICY videos_public_read
  ON public.videos
  FOR SELECT TO public
  USING (published IS TRUE);

CREATE POLICY kids_content_public_read
  ON public.kids_content
  FOR SELECT TO anon, authenticated
  USING (published IS TRUE AND is_active IS TRUE);
CREATE POLICY admin_all_kids_content_insert
  ON public.kids_content
  FOR INSERT TO authenticated
  WITH CHECK (private.is_admin_user());
CREATE POLICY admin_all_kids_content_update
  ON public.kids_content
  FOR UPDATE TO authenticated
  USING (private.is_admin_user())
  WITH CHECK (private.is_admin_user());
CREATE POLICY admin_all_kids_content_delete
  ON public.kids_content
  FOR DELETE TO authenticated
  USING (private.is_admin_user());

GRANT ALL PRIVILEGES ON TABLE public.social_publish_queue TO PUBLIC, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.video_generation_requests TO PUBLIC, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.media_assets TO PUBLIC, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.site_audio_assets TO PUBLIC, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.videos TO PUBLIC, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.kids_content TO PUBLIC, anon, authenticated, service_role;

INSERT INTO public.social_publish_queue (id, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'queued');
INSERT INTO public.video_generation_requests (id, status, title)
VALUES ('22222222-2222-2222-2222-222222222222', 'completed', 'fixture');
INSERT INTO public.media_assets (id, published, verified_rights, rights_verified, url)
VALUES
  ('33333333-3333-3333-3333-333333333333', true, true, false, 'https://cdn.example/verified.jpg'),
  ('33333333-3333-3333-3333-333333333334', true, false, false, 'https://cdn.example/unverified.jpg'),
  ('33333333-3333-3333-3333-333333333335', false, true, true, 'https://cdn.example/unpublished.jpg');
INSERT INTO public.site_audio_assets (id, title, storage_path)
VALUES ('44444444-4444-4444-4444-444444444444', 'fixture', 'audio/fixture.mp3');
INSERT INTO public.videos (id, title, published)
VALUES
  ('55555555-5555-5555-5555-555555555555', 'published fixture', true),
  ('55555555-5555-5555-5555-555555555556', 'unpublished fixture', false);
INSERT INTO public.kids_content (id, slug, title, type, published, is_active)
VALUES
  ('77777777-7777-7777-7777-777777777771', 'published-kids-fixture', 'published kids fixture', 'story', true, true),
  ('77777777-7777-7777-7777-777777777772', 'inactive-kids-fixture', 'inactive kids fixture', 'story', true, false),
  ('77777777-7777-7777-7777-777777777773', 'unpublished-kids-fixture', 'unpublished kids fixture', 'story', false, true);
INSERT INTO storage.objects (id, bucket_id, name)
VALUES (1, 'site-audio', 'existing.mp3');

DO $legacy_fixture$
BEGIN
  IF NOT has_table_privilege('authenticated', 'public.social_publish_queue', 'INSERT') THEN
    RAISE EXCEPTION 'Legacy social queue fixture did not reproduce authenticated INSERT privilege';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'social_publish_queue'
      AND policyname = 'social_publish_queue_admin_write'
      AND cmd = 'ALL'
  ) THEN
    RAISE EXCEPTION 'Legacy social queue fixture did not reproduce the admin ALL policy';
  END IF;
  IF (
    SELECT count(*) FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'social_publish_queue'
      AND policyname IN (
        'social_publish_queue_admin_all',
        'social_publish_queue_service_role_all',
        'social_publish_queue_admin_insert',
        'social_publish_queue_admin_update',
        'social_publish_queue_admin_delete',
        'social_publish_queue_authenticated_read_published_or_admin'
      )
  ) <> 6 THEN
    RAISE EXCEPTION 'Legacy social queue split/alternate policies were not reproduced';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.video_generation_requests', 'INSERT') THEN
    RAISE EXCEPTION 'Legacy video generation fixture did not reproduce authenticated INSERT privilege';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.media_assets', 'UPDATE') THEN
    RAISE EXCEPTION 'Legacy media asset fixture did not reproduce authenticated UPDATE privilege';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_assets'
      AND policyname = 'media_assets_admin_select' AND cmd = 'SELECT'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_assets'
      AND policyname = 'media_assets_admin_insert' AND cmd = 'INSERT'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_assets'
      AND policyname = 'media_assets_admin_update' AND cmd = 'UPDATE'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_assets'
      AND policyname = 'media_assets_admin_delete' AND cmd = 'DELETE'
  ) THEN
    RAISE EXCEPTION 'Legacy split media asset admin policies were not reproduced';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.site_audio_assets', 'DELETE') THEN
    RAISE EXCEPTION 'Legacy site audio fixture did not reproduce authenticated DELETE privilege';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.videos', 'UPDATE') THEN
    RAISE EXCEPTION 'Legacy videos fixture did not reproduce authenticated UPDATE privilege';
  END IF;
  IF NOT has_table_privilege('authenticated', 'storage.objects', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'storage.objects', 'DELETE') THEN
    RAISE EXCEPTION 'Legacy site-audio Storage fixture did not reproduce authenticated object writes';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_policies
      WHERE schemaname='storage' AND tablename='objects'
        AND policyname IN ('site_audio_admin_insert', 'site_audio_admin_delete')) <> 2 THEN
    RAISE EXCEPTION 'Legacy site-audio Storage write policies were not reproduced';
  END IF;
END
$legacy_fixture$;
