-- Reconciliation marker for the already-applied verified video content pack.
-- Remote migration 20261002050101 is already present in production history.
-- The canonical repository implementation lives in 20261002090000_verified_video_content_pack.sql
-- and is conflict-safe/idempotent. Keep this no-op marker so Supabase Preview sees the
-- remote version in local history without replaying the content migration twice.
select 1;
