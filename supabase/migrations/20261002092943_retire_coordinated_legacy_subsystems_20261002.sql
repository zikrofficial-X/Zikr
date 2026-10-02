-- Supabase migration-history reconciliation marker.
-- Production already records version 20261002092943 under this migration name.
-- The canonical executable retirement migration is kept at a later local version:
-- 20261002130000_retire_coordinated_legacy_subsystems_20261002.sql
-- This marker intentionally performs no schema/data changes.
select 1;
