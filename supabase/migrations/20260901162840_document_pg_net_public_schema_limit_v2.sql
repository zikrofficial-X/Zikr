-- Reconciliation marker for the production control-plane migration.
-- pg_net remains provider-managed in public because this installation does not
-- support ALTER EXTENSION ... SET SCHEMA. No application schema change here.
select 1;
