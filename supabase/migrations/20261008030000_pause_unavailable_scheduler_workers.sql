-- Disable scheduled workers that currently have no deployable runtime target.
-- Re-enable job 3 after source-verified-content-agent is deployed.
select cron.alter_job(job_id => 3, active => false);
select cron.alter_job(job_id => 4, active => false);
