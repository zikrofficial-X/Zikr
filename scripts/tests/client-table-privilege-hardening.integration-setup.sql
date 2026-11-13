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
  CREATE ROLE supabase_admin NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

GRANT USAGE, CREATE ON SCHEMA public TO supabase_admin;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
  SELECT false;
$function$;
GRANT EXECUTE ON FUNCTION private.is_admin_user() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT private.is_admin_user();
$function$;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO PUBLIC, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES TO PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  GRANT TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES TO PUBLIC, anon, authenticated;

CREATE TABLE public.client_privilege_hardening_existing (
  id bigint PRIMARY KEY
);

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLE public.client_privilege_hardening_existing TO PUBLIC, anon, authenticated;

SET ROLE supabase_admin;
CREATE TABLE public.client_privilege_hardening_supabase_admin_before (
  id bigint PRIMARY KEY
);
RESET ROLE;

DO $precheck$
BEGIN
  IF NOT has_table_privilege('anon', 'public.client_privilege_hardening_existing', 'TRUNCATE')
     OR NOT has_table_privilege('authenticated', 'public.client_privilege_hardening_existing', 'MAINTAIN') THEN
    RAISE EXCEPTION 'Privilege fixture did not reproduce the pre-remediation client DDL grants';
  END IF;
  IF NOT has_table_privilege('anon', 'public.client_privilege_hardening_supabase_admin_before', 'TRIGGER')
     OR NOT has_table_privilege('authenticated', 'public.client_privilege_hardening_supabase_admin_before', 'TRUNCATE') THEN
    RAISE EXCEPTION 'supabase_admin default ACL fixture did not reproduce the pre-remediation client DDL grants';
  END IF;
END
$precheck$;
