BEGIN;

-- Public-schema functions are exposed through PostgREST. A SECURITY DEFINER
-- function must never become browser-callable merely because its creator forgot
-- an explicit REVOKE. Future RPCs must opt in with explicit GRANT statements.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

DO $default_acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated';
  END IF;
END
$default_acl$;

COMMIT;
