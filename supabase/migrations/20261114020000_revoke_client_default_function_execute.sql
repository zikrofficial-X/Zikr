BEGIN;

-- Public-schema functions are exposed through PostgREST. PostgreSQL's built-in
-- global default grants EXECUTE on new functions to PUBLIC. A schema-scoped
-- REVOKE cannot remove that global grant, so revoke it globally for both
-- migration owners, then remove explicit browser-role grants in public.
-- Future RPCs must opt in with explicit GRANT statements.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

DO $default_acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
  END IF;
END
$default_acl$;

COMMIT;
