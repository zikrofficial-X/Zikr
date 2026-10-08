-- Migration-history reconciliation marker.
-- Remote production already contains this version ID. The canonical repository
-- implementation is retained under 20261008050000_repoint_production_cron_to_current_project.sql.
-- This file is intentionally schema-neutral to prevent replaying production DDL.
select 1;
