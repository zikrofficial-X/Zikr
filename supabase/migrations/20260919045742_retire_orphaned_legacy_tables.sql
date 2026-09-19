-- Canonical local representation of the production migration recorded as
-- 20260919045742 / retire_orphaned_legacy_tables.
-- The same cleanup is idempotent and keeps the current repository schema aligned
-- with the live database after remote history reconciliation.

drop table if exists public.generated_research;
drop table if exists public.research_requests;
drop table if exists public.payments;
drop table if exists public.user_subscriptions;
drop table if exists public.subscriptions;
drop table if exists public.saved_stories;
drop table if exists public.episodes;
