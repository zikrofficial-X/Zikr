-- Reconciliation marker for an already-applied production migration.
-- Remote version 20260919044739 retired the same empty legacy runtime tables
-- that are canonically re-applied later by 20260919060000.
-- Keep this local marker so the Supabase migration ledger and repository history
-- remain version-complete without replaying the destructive operation twice.
select 1;
