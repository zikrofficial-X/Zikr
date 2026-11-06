-- Schema-neutral reconciliation marker.
-- This second version is also recorded in the live Supabase migration history.
-- The canonical schema change is retained in
-- 20261106160000_allow_internal_videos_in_content_publish_queue.sql.
-- Keep this marker as a no-op to preserve the exact remote version ledger.
SELECT 1;
