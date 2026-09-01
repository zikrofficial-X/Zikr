-- Reconciliation marker for the production-applied Supabase migration.
-- The migration was applied through the Supabase control plane after confirming
-- pg_net cannot be moved with ALTER EXTENSION SET SCHEMA on this installation.
-- No schema changes are performed here.
select 1;
