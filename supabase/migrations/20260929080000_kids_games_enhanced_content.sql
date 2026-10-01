-- History reconciliation marker.
-- The original 20260929 migration already created these objects in production.
-- Keep this migration intentionally schema-neutral after repairing the 8-digit
-- history entry to avoid replaying already-applied DDL.
select 1;
