-- Production history checkpoint: REST request defaults were already repaired in production.
-- Keep this migration as an idempotent no-op so local and remote histories remain aligned.
select 1;
