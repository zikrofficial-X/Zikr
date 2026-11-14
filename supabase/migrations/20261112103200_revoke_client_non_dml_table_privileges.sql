BEGIN;

-- Row-level security does not mediate TRUNCATE. Browser roles must not hold
-- table-wide DDL/maintenance privileges; ordinary DML remains governed by RLS.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON ALL TABLES IN SCHEMA public
  FROM PUBLIC, anon, authenticated;

-- Supabase migrations create public tables as postgres. Supabase-managed
-- migrations may also create them as supabase_admin, so harden both defaults.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES
  FROM PUBLIC, anon, authenticated;

DO $default_acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES FROM PUBLIC, anon, authenticated';
  END IF;
END
$default_acl$;

COMMIT;
