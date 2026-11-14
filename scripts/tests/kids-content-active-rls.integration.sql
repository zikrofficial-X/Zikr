\set ON_ERROR_STOP on

BEGIN;
SET LOCAL ROLE anon;
DO $anon_read$
DECLARE
  visible_rows integer;
BEGIN
  SELECT count(*) INTO visible_rows FROM public.kids_content;
  IF visible_rows <> 1 THEN
    RAISE EXCEPTION 'anon must read exactly one active published Kids row, found %', visible_rows;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.kids_content WHERE slug <> 'active-published'
  ) THEN
    RAISE EXCEPTION 'anon can read inactive or unpublished Kids content';
  END IF;
END
$anon_read$;
COMMIT;

BEGIN;
SET LOCAL ROLE authenticated;
DO $authenticated_read$
DECLARE
  visible_rows integer;
BEGIN
  SELECT count(*) INTO visible_rows FROM public.kids_content;
  IF visible_rows <> 1 THEN
    RAISE EXCEPTION 'authenticated non-admin must read exactly one active published Kids row, found %', visible_rows;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.kids_content WHERE slug <> 'active-published'
  ) THEN
    RAISE EXCEPTION 'authenticated non-admin can read inactive or unpublished Kids content';
  END IF;
END
$authenticated_read$;
COMMIT;

BEGIN;
SET LOCAL ROLE service_role;
DO $share_rpc$
DECLARE
  changed_rows integer;
  current_shares integer;
BEGIN
  SELECT count(*) INTO changed_rows
  FROM public.increment_kids_content_shares('active-published');
  IF changed_rows <> 1 THEN
    RAISE EXCEPTION 'service_role could not increment active published Kids content';
  END IF;

  SELECT shares INTO current_shares
  FROM public.kids_content
  WHERE slug = 'active-published';
  IF current_shares <> 1 THEN
    RAISE EXCEPTION 'active published Kids share count did not increment exactly once';
  END IF;

  SELECT count(*) INTO changed_rows
  FROM public.increment_kids_content_shares('inactive-published');
  IF changed_rows <> 0 THEN
    RAISE EXCEPTION 'inactive published Kids content accepted a share increment';
  END IF;

  SELECT count(*) INTO changed_rows
  FROM public.increment_kids_content_shares('unpublished-active');
  IF changed_rows <> 0 THEN
    RAISE EXCEPTION 'unpublished Kids content accepted a share increment';
  END IF;
END
$share_rpc$;
COMMIT;

DO $verify_contract$
DECLARE
  policy_qual text;
  policy_roles text;
  rls_enabled boolean;
  function_security_definer boolean;
  function_config text[];
BEGIN
  SELECT qual, roles::text
  INTO policy_qual, policy_roles
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'kids_content'
    AND policyname = 'kids_content_public_read';

  IF policy_qual IS NULL
     OR policy_qual NOT ILIKE '%published%'
     OR policy_qual NOT ILIKE '%is_active%' THEN
    RAISE EXCEPTION 'Kids public-read policy must require both published and is_active';
  END IF;
  IF policy_roles NOT ILIKE '%anon%' OR policy_roles NOT ILIKE '%authenticated%' OR policy_roles ILIKE '%public%' THEN
    RAISE EXCEPTION 'Kids public-read policy must target only anon and authenticated roles, found %', policy_roles;
  END IF;

  SELECT relrowsecurity INTO rls_enabled
  FROM pg_catalog.pg_class
  WHERE oid = 'public.kids_content'::regclass;
  IF rls_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'RLS must remain enabled on public.kids_content';
  END IF;

  SELECT prosecdef, proconfig
  INTO function_security_definer, function_config
  FROM pg_catalog.pg_proc
  WHERE oid = 'public.increment_kids_content_shares(text)'::regprocedure;
  IF function_security_definer IS TRUE THEN
    RAISE EXCEPTION 'Kids share RPC must remain SECURITY INVOKER';
  END IF;
  IF NOT coalesce(function_config @> ARRAY['search_path=""'], false) THEN
    RAISE EXCEPTION 'Kids share RPC must pin an empty search_path';
  END IF;

  IF has_function_privilege('anon', 'public.increment_kids_content_shares(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute the Kids share RPC';
  END IF;
  IF has_function_privilege('authenticated', 'public.increment_kids_content_shares(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must not execute the Kids share RPC';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.increment_kids_content_shares(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role must retain the Kids share RPC permission';
  END IF;
END
$verify_contract$;

SELECT 'KIDS_CONTENT_ACTIVE_RLS_INTEGRATION_PASSED' AS result;
