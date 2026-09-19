-- Reconciliation marker for an already-applied production migration.
-- The current repository schema/content is represented by subsequent canonical migrations.
-- Keeping this version locally preserves Supabase migration-ledger parity without replaying legacy seed work.
select 1;
