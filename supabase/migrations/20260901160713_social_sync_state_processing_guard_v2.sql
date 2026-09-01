-- Reconciliation marker for the production migration history.
-- The corresponding migration version is already applied in Supabase production.
-- The live schema is represented by the tracked social-sync hardening migrations.
-- Keep this migration intentionally side-effect free so Preview can replay the
-- production migration history without re-running the production DDL.
select 1;
