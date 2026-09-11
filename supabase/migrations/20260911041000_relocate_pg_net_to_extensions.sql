-- Security hardening: keep pg_net extension metadata outside public.
-- pg_net 0.20.0 is non-relocatable, so SET SCHEMA is not available.
-- Recreate the extension in the dedicated extensions schema.
-- pg_net keeps its runtime functions/tables in the net schema.
-- This migration intentionally does not move or delete application data.

create schema if not exists extensions;

drop extension if exists pg_net;
create extension pg_net with schema extensions;
