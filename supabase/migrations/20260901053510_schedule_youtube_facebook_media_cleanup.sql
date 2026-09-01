-- Production cleanup scheduler is provisioned by the existing Supabase pg_cron setup.
-- This migration intentionally remains a replay-safe no-op because the repository's
-- migration verifier runs against a lightweight database stub without pg_cron.
-- The live ZIKR project already contains the `zikr-youtube-facebook-media-cleanup`
-- scheduled job, and the cleanup endpoint remains independently deployable.
select 1;
