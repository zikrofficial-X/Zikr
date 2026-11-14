\set ON_ERROR_STOP on

DO $privilege_contract$
DECLARE
  table_name text;
  server_only_tables text[] := ARRAY[
    'social_publish_queue',
    'video_generation_requests',
    'site_audio_assets'
  ];
  all_tables text[] := ARRAY[
    'social_publish_queue',
    'video_generation_requests',
    'media_assets',
    'site_audio_assets',
    'videos',
    'kids_content'
  ];
BEGIN
  FOREACH table_name IN ARRAY server_only_tables LOOP
    IF has_table_privilege('anon', 'public.' || table_name, 'SELECT')
       OR has_table_privilege('anon', 'public.' || table_name, 'INSERT')
       OR has_table_privilege('anon', 'public.' || table_name, 'UPDATE')
       OR has_table_privilege('anon', 'public.' || table_name, 'DELETE') THEN
      RAISE EXCEPTION 'anon retains direct access to server-only table public.%', table_name;
    END IF;
    IF has_table_privilege('authenticated', 'public.' || table_name, 'SELECT')
       OR has_table_privilege('authenticated', 'public.' || table_name, 'INSERT')
       OR has_table_privilege('authenticated', 'public.' || table_name, 'UPDATE')
       OR has_table_privilege('authenticated', 'public.' || table_name, 'DELETE') THEN
      RAISE EXCEPTION 'authenticated retains direct access to server-only table public.%', table_name;
    END IF;
  END LOOP;

  IF NOT has_table_privilege('anon', 'public.media_assets', 'SELECT') THEN
    RAISE EXCEPTION 'anon must retain verified public media asset reads';
  END IF;
  IF has_table_privilege('authenticated', 'public.media_assets', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated direct media asset reads are not part of the tracked client contract';
  END IF;
  IF has_table_privilege('anon', 'public.media_assets', 'INSERT')
     OR has_table_privilege('anon', 'public.media_assets', 'UPDATE')
     OR has_table_privilege('anon', 'public.media_assets', 'DELETE')
     OR has_table_privilege('authenticated', 'public.media_assets', 'INSERT')
     OR has_table_privilege('authenticated', 'public.media_assets', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.media_assets', 'DELETE') THEN
    RAISE EXCEPTION 'public roles must not mutate media asset rights or storage metadata';
  END IF;

  IF NOT has_table_privilege('anon', 'public.videos', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.videos', 'SELECT') THEN
    RAISE EXCEPTION 'public and authenticated catalog reads must remain available for published videos';
  END IF;
  IF has_table_privilege('anon', 'public.videos', 'INSERT')
     OR has_table_privilege('anon', 'public.videos', 'UPDATE')
     OR has_table_privilege('anon', 'public.videos', 'DELETE')
     OR has_table_privilege('authenticated', 'public.videos', 'INSERT')
     OR has_table_privilege('authenticated', 'public.videos', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.videos', 'DELETE') THEN
    RAISE EXCEPTION 'public roles must not mutate the video catalog';
  END IF;

  IF NOT has_table_privilege('anon', 'public.kids_content', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.kids_content', 'SELECT') THEN
    RAISE EXCEPTION 'public and authenticated roles must retain RLS-filtered Kids content reads';
  END IF;
  IF has_table_privilege('anon', 'public.kids_content', 'INSERT')
     OR has_table_privilege('anon', 'public.kids_content', 'UPDATE')
     OR has_table_privilege('anon', 'public.kids_content', 'DELETE')
     OR has_table_privilege('authenticated', 'public.kids_content', 'INSERT')
     OR has_table_privilege('authenticated', 'public.kids_content', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.kids_content', 'DELETE') THEN
    RAISE EXCEPTION 'public roles must not mutate Kids content outside the audited server action';
  END IF;

  FOREACH table_name IN ARRAY all_tables LOOP
    IF NOT has_table_privilege('service_role', 'public.' || table_name, 'SELECT')
       OR NOT has_table_privilege('service_role', 'public.' || table_name, 'INSERT')
       OR NOT has_table_privilege('service_role', 'public.' || table_name, 'UPDATE')
       OR NOT has_table_privilege('service_role', 'public.' || table_name, 'DELETE') THEN
      RAISE EXCEPTION 'service_role is missing a required privilege on public.%', table_name;
    END IF;
    IF NOT (
      SELECT relrowsecurity
      FROM pg_catalog.pg_class
      WHERE oid = ('public.' || table_name)::regclass
    ) THEN
      RAISE EXCEPTION 'RLS must remain enabled on public.%', table_name;
    END IF;
  END LOOP;

  IF (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='social_publish_queue') <> 0
     OR (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='video_generation_requests') <> 0
     OR (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='site_audio_assets') <> 0 THEN
    RAISE EXCEPTION 'Server-only admin tables must not retain authenticated policies';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='media_assets') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_policies
       WHERE schemaname='public' AND tablename='media_assets'
         AND policyname='media_assets_public_read' AND cmd='SELECT'
     ) THEN
    RAISE EXCEPTION 'Only the verified public media read policy should remain';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='videos') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_policies
       WHERE schemaname='public' AND tablename='videos'
         AND policyname='videos_public_read' AND cmd='SELECT'
     ) THEN
    RAISE EXCEPTION 'Only the published public video read policy should remain';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='kids_content') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_policies
       WHERE schemaname='public' AND tablename='kids_content'
         AND policyname='kids_content_public_read' AND cmd='SELECT'
     ) THEN
    RAISE EXCEPTION 'Only the active published Kids content read policy should remain';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid='storage.objects'::regclass) THEN
    RAISE EXCEPTION 'Storage object RLS must remain enabled';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname IN ('site_audio_admin_insert', 'site_audio_admin_delete')
  ) THEN
    RAISE EXCEPTION 'Direct authenticated site-audio Storage write policies must be removed';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='site_audio_public_read' AND cmd='SELECT'
  ) THEN
    RAISE EXCEPTION 'Public site-audio reads must remain available';
  END IF;
END
$privilege_contract$;

BEGIN;
SET LOCAL ROLE anon;
DO $public_read$
DECLARE
  media_rows integer;
  video_rows integer;
BEGIN
  SELECT count(*) INTO media_rows FROM public.media_assets;
  IF media_rows <> 1 THEN
    RAISE EXCEPTION 'anon must read only published media assets with verified rights; found %', media_rows;
  END IF;
  SELECT count(*) INTO video_rows FROM public.videos;
  IF video_rows <> 1 THEN
    RAISE EXCEPTION 'anon must read only published videos; found %', video_rows;
  END IF;
  IF (SELECT count(*) FROM public.kids_content) <> 1 THEN
    RAISE EXCEPTION 'anon must read only active published Kids content';
  END IF;
END
$public_read$;
COMMIT;


BEGIN;
SET LOCAL ROLE anon;
DO $storage_public_read$
DECLARE
  object_rows integer;
BEGIN
  SELECT count(*) INTO object_rows FROM storage.objects WHERE bucket_id='site-audio';
  IF object_rows <> 1 THEN
    RAISE EXCEPTION 'anon must retain public site-audio object reads; found %', object_rows;
  END IF;
END
$storage_public_read$;
COMMIT;

BEGIN;
SET LOCAL ROLE authenticated;
DO $storage_direct_write_denied$
DECLARE
  insert_denied boolean := false;
  deleted_rows integer := 0;
BEGIN
  BEGIN
    INSERT INTO storage.objects (id, bucket_id, name)
    VALUES (2, 'site-audio', 'bypass.mp3');
  EXCEPTION WHEN insufficient_privilege THEN
    insert_denied := true;
  END;
  IF NOT insert_denied THEN
    RAISE EXCEPTION 'authenticated direct site-audio object INSERT must be denied';
  END IF;

  DELETE FROM storage.objects WHERE bucket_id='site-audio' AND name='existing.mp3';
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  IF deleted_rows <> 0 THEN
    RAISE EXCEPTION 'authenticated direct site-audio object DELETE must not remove an object';
  END IF;
END
$storage_direct_write_denied$;
COMMIT;

BEGIN;
SET LOCAL ROLE authenticated;
DO $authenticated_video_read$
DECLARE
  video_rows integer;
BEGIN
  SELECT count(*) INTO video_rows FROM public.videos;
  IF video_rows <> 1 THEN
    RAISE EXCEPTION 'authenticated must retain only published video catalog reads; found %', video_rows;
  END IF;
END
$authenticated_video_read$;
COMMIT;

BEGIN;
SET LOCAL ROLE service_role;
DO $service_role_crud$
BEGIN
  INSERT INTO public.social_publish_queue (id, status, metadata)
  VALUES ('66666666-6666-6666-6666-666666666661', 'queued', '{}'::jsonb);
  UPDATE public.social_publish_queue SET status='published'
  WHERE id='66666666-6666-6666-6666-666666666661';
  DELETE FROM public.social_publish_queue
  WHERE id='66666666-6666-6666-6666-666666666661';

  INSERT INTO public.video_generation_requests (id, status, title)
  VALUES ('66666666-6666-6666-6666-666666666662', 'queued', 'service-role fixture');
  UPDATE public.video_generation_requests SET status='completed'
  WHERE id='66666666-6666-6666-6666-666666666662';
  DELETE FROM public.video_generation_requests
  WHERE id='66666666-6666-6666-6666-666666666662';

  INSERT INTO public.site_audio_assets (id, title, storage_path)
  VALUES ('66666666-6666-6666-6666-666666666663', 'service-role fixture', 'audio/service-role.mp3');
  UPDATE public.site_audio_assets SET title='updated fixture'
  WHERE id='66666666-6666-6666-6666-666666666663';
  DELETE FROM public.site_audio_assets
  WHERE id='66666666-6666-6666-6666-666666666663';

  INSERT INTO public.media_assets (id, published, verified_rights, rights_verified, url)
  VALUES ('66666666-6666-6666-6666-666666666664', false, false, false, 'https://cdn.example/service-role.jpg');
  UPDATE public.media_assets SET verified_rights=true
  WHERE id='66666666-6666-6666-6666-666666666664';
  DELETE FROM public.media_assets
  WHERE id='66666666-6666-6666-6666-666666666664';

  INSERT INTO public.videos (id, title, published)
  VALUES ('66666666-6666-6666-6666-666666666665', 'service-role fixture', false);
  UPDATE public.videos SET published=true
  WHERE id='66666666-6666-6666-6666-666666666665';
  DELETE FROM public.videos
  WHERE id='66666666-6666-6666-6666-666666666665';

  INSERT INTO public.kids_content (id, slug, title, type, published, is_active)
  VALUES ('66666666-6666-6666-6666-666666666666', 'service-role-kids-fixture', 'service role fixture', 'story', false, true);
  UPDATE public.kids_content SET published=true
  WHERE id='66666666-6666-6666-6666-666666666666';
  DELETE FROM public.kids_content
  WHERE id='66666666-6666-6666-6666-666666666666';

  INSERT INTO storage.objects (id, bucket_id, name)
  VALUES (3, 'site-audio', 'service-role.mp3');
  DELETE FROM storage.objects WHERE id=3;
END
$service_role_crud$;
COMMIT;

SELECT 'ADMIN_MANAGED_WRITE_RLS_INTEGRATION_PASSED' AS result;
