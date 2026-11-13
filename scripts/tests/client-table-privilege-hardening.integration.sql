\set ON_ERROR_STOP on

DO $admin_predicate_acl$
BEGIN
  IF NOT has_function_privilege('anon', 'public.is_admin_user()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Legacy fixture did not reproduce public admin-predicate execution';
  END IF;
END
$admin_predicate_acl$;

CREATE TABLE public.client_privilege_hardening_postgres_after (
  id bigint PRIMARY KEY
);

SET ROLE supabase_admin;
CREATE TABLE public.client_privilege_hardening_supabase_admin_after (
  id bigint PRIMARY KEY
);
RESET ROLE;

DO $admin_predicate_acl_after$
BEGIN
  IF has_function_privilege('anon', 'public.is_admin_user()', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon still has EXECUTE on public.is_admin_user after hardening';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.is_admin_user()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated lost its explicit public.is_admin_user permission';
  END IF;
END
$admin_predicate_acl_after$;

DO $verify$
DECLARE
  table_name text;
  privilege_name text;
  fixture_tables text[] := ARRAY[
    'client_privilege_hardening_existing',
    'client_privilege_hardening_supabase_admin_before',
    'client_privilege_hardening_postgres_after',
    'client_privilege_hardening_supabase_admin_after'
  ];
  ddl_privileges text[] := ARRAY['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'];
BEGIN
  FOREACH table_name IN ARRAY fixture_tables LOOP
    FOREACH privilege_name IN ARRAY ddl_privileges LOOP
      IF has_table_privilege('anon', 'public.' || quote_ident(table_name), privilege_name) THEN
        RAISE EXCEPTION 'anon still has % on public.% after privilege hardening', privilege_name, table_name;
      END IF;
      IF has_table_privilege('authenticated', 'public.' || quote_ident(table_name), privilege_name) THEN
        RAISE EXCEPTION 'authenticated still has % on public.% after privilege hardening', privilege_name, table_name;
      END IF;
    END LOOP;
  END LOOP;

  FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
    IF NOT has_table_privilege('authenticated', 'public.client_privilege_hardening_existing', privilege_name) THEN
      RAISE EXCEPTION 'Existing authenticated DML privilege % was unexpectedly removed', privilege_name;
    END IF;
  END LOOP;
END
$verify$;
