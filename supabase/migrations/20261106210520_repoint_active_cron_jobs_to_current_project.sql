-- Schema-neutral migration-history marker.
-- The production cron endpoint cutover is already implemented by
-- 20261106210440_repoint_active_cron_jobs_to_current_project.sql.
-- This second remote migration version repeated the same operation idempotently.
SELECT 1;
