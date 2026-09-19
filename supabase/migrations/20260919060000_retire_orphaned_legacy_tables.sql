-- Retire legacy tables that have no active application consumers.
-- The current application uses feature-specific alternatives:
--   saved_stories -> story_favorites
--   subscription/billing tables -> no active billing flow after global cancellation
--   research_requests/generated_research -> source-verified content pipeline
--   episodes -> videos/youtube
-- All target tables were audited before this migration and currently contain zero rows.
-- Child tables are removed before their parents so the migration remains deterministic.

drop table if exists public.generated_research;
drop table if exists public.research_requests;
drop table if exists public.payments;
drop table if exists public.user_subscriptions;
drop table if exists public.subscriptions;
drop table if exists public.saved_stories;
drop table if exists public.episodes;
