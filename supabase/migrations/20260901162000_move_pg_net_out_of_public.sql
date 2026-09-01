-- Supabase-hosted pg_net does not support ALTER EXTENSION ... SET SCHEMA.
-- Keep pg_net in its provider-managed schema and treat the advisor warning as
-- an intentional platform constraint. The scheduled job continues to call
-- the provider function using its canonical net.http_post name.
select 1;
