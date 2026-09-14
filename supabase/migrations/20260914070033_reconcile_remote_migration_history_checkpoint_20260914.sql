-- Production history checkpoint: remote migration history reconciliation was already completed.
-- Keep this migration as an idempotent no-op so local and remote histories remain aligned.
select 1;
