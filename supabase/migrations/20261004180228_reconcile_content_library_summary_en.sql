-- Migration-history reconciliation marker.
-- Supabase production recorded the idempotent content-library hardening
-- migration under version 20261004180228, while the canonical migration
-- file remains 20261004190000_content_library_summary_en.sql.
-- No schema/data work is performed here; this keeps local and remote
-- migration history aligned for Supabase Preview.

select 1;
