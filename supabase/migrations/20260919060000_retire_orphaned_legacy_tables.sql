-- Canonical local representation of the production migration recorded as
-- 20260919060000 / retire_orphaned_legacy_tables.
-- This cleanup is idempotent and retires only audited, empty legacy runtime tables.

drop table if exists public.generated_research;
drop table if exists public.research_requests;
drop table if exists public.payments;
drop table if exists public.user_subscriptions;
drop table if exists public.subscriptions;
drop table if exists public.saved_stories;
drop table if exists public.episodes;
