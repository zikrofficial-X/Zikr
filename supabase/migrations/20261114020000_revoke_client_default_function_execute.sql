BEGIN;

-- Public API schemas are configured in supabase/config.toml as public, storage,
-- and graphql_public. PostgreSQL's built-in global default grants EXECUTE on new
-- functions to PUBLIC. Schema-specific default grants are additive and survive
-- a global REVOKE, so both layers must be hardened for each migration owner.
-- Existing function ACLs are intentionally unchanged; sensitive existing RPCs
-- keep their explicit, individually reviewed GRANT/REVOKE contracts.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

DO $postgres_schema_acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'graphql_public') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA graphql_public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'graphql') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA graphql REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
  END IF;
END
$postgres_schema_acl$;

DO $supabase_admin_schema_acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA storage REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'graphql_public') THEN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'graphql') THEN
      EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
    END IF;
  END IF;
END
$supabase_admin_schema_acl$;

COMMIT;
