-- Migration-history reconciliation marker.
-- Remote production already contains this version ID. The canonical repository
-- implementation is retained under 20261008060000_retire_obsolete_cleanup_cron.sql.
-- This file is intentionally schema-neutral to prevent replaying production DDL.
select 1;
