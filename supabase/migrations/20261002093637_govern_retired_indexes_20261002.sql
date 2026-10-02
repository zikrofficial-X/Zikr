-- Supabase migration-history reconciliation marker.
-- Production already records version 20261002093637 under this migration name.
-- The canonical executable index-governance migration is kept at a later local version:
-- 20261002133000_govern_retired_indexes_20261002.sql
-- This marker intentionally performs no schema/data changes.
select 1;
