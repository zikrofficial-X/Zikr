-- Reconciliation marker for the production migration recorded remotely as
-- 20260929025052 / quran_schema_compatibility_20260929.
--
-- The migration is already applied in the canonical Supabase project, but its
-- version was missing from the repository's local migration directory. Keep
-- this local marker so Supabase GitHub Preview can reconcile the migration
-- history without replaying an already-applied production migration.

select 1;
