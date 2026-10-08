-- Retire the obsolete YouTube/Facebook cleanup cron job.
-- No cleanup Edge Function exists in the current repository and its Vault targets are absent.
select cron.alter_job(job_id => 3, active => true);
select cron.unschedule(job_id => 4);
