-- Migration-history reconciliation marker.
-- Remote production already contains this version ID. The canonical repository
-- migration is retained under 20261004190000_content_library_summary_en.sql.
-- This file is intentionally schema-neutral to prevent replaying production DDL.
select 1;
