-- Reconciliation marker for the already-applied RLS overlap consolidation.
-- The live project already contains the policy hardening and the earlier
-- deterministic reconciliation migrations in this repository replay the
-- resulting state. Keep this version-specific no-op so local migration replay
-- remains deterministic and does not attempt to alter policies that later
-- cleanup migrations intentionally removed.
select 1;
