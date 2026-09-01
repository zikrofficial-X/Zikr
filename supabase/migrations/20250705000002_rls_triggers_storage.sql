-- Reconciliation marker for the canonical remote migration version.
-- The production schema changes from this legacy migration are already applied.
-- Intentionally no-op to prevent replaying legacy DDL.
SELECT 1;
