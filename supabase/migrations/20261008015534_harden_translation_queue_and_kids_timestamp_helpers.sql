-- Migration-history reconciliation marker.
-- Remote production already contains this version ID. The canonical repository
-- migration is retained under 20261008070000_harden_translation_queue_and_kids_timestamp_helpers.sql.
-- This file is intentionally schema-neutral to prevent replaying production DDL.
select 1;
