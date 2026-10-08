-- Migration-history reconciliation marker.
-- Remote production already contains this version ID. The canonical repository
-- migration is retained under 20261003090000_content_translation_queue.sql.
-- This file is intentionally schema-neutral to prevent duplicate table creation.
select 1;
