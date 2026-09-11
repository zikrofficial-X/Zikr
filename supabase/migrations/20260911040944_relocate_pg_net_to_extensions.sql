-- Security hardening: keep pg_net extension metadata outside public.
-- pg_net 0.20.0 is non-relocatable, so SET SCHEMA is not available.
-- Recreate the extension in the dedicated extensions schema on Supabase.
-- The local migration validator does not ship pg_net, so it safely skips the
-- recreate block when the extension is not available in the target environment.
-- This migration intentionally does not move or delete application data.

create schema if not exists extensions;

do $$
begin
  if exists (
    select 1
    from pg_available_extensions
    where name = 'pg_net'
  ) then
    execute 'drop extension if exists pg_net';
    execute 'create extension pg_net with schema extensions';
  end if;
end
$$;
