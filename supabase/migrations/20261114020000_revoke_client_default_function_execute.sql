BEGIN;

-- Default function ACLs are owner-specific. Harden both the global PUBLIC
-- default and the schema-specific defaults for every owner that creates
-- functions in the exposed API schemas. Keep service_role as the explicit
-- server-side execution path after removing browser/PUBLIC inheritance.
-- Existing function ACLs are intentionally unchanged; sensitive existing RPCs
-- retain their individually reviewed GRANT/REVOKE contracts.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

DO $postgres_schema_acl$
DECLARE
  schema_name text;
BEGIN
  FOREACH schema_name IN ARRAY ARRAY['public', 'storage', 'graphql_public', 'graphql'] LOOP
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = schema_name) THEN
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA %I REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated',
        schema_name
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA %I GRANT EXECUTE ON FUNCTIONS TO service_role',
        schema_name
      );
    END IF;
  END LOOP;
END
$postgres_schema_acl$;

DO $supabase_admin_schema_acl$
DECLARE
  schema_name text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin
      REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

    FOREACH schema_name IN ARRAY ARRAY['public', 'storage', 'graphql_public', 'graphql'] LOOP
      IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = schema_name) THEN
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA %I REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated',
          schema_name
        );
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA %I GRANT EXECUTE ON FUNCTIONS TO service_role',
          schema_name
        );
      END IF;
    END LOOP;
  END IF;
END
$supabase_admin_schema_acl$;

-- Live Storage API functions are owned by supabase_storage_admin rather than
-- postgres/supabase_admin. Without this owner-specific rule, future storage
-- functions would continue inheriting PUBLIC EXECUTE.
DO $supabase_storage_admin_acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_storage_admin')
     AND EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_storage_admin REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_storage_admin IN SCHEMA storage REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_storage_admin IN SCHEMA storage GRANT EXECUTE ON FUNCTIONS TO service_role';
  END IF;
END
$supabase_storage_admin_acl$;

COMMIT;
