-- Security hardening for the public free-tier statistics view and timestamp helpers.
-- PostgreSQL 17 supports security_invoker views, so the view now honors the
-- querying role's permissions and the underlying video_narrations RLS policy.

ALTER VIEW public.free_tier_statistics
  SET (security_invoker = true);

ALTER FUNCTION public.update_kids_game_progress_timestamp()
  SET search_path = pg_catalog;

ALTER FUNCTION public.update_kids_character_selection_timestamp()
  SET search_path = pg_catalog;

ALTER FUNCTION public.update_game_scenarios_timestamp()
  SET search_path = pg_catalog;

ALTER FUNCTION public.update_game_graphics_timestamp()
  SET search_path = pg_catalog;

ALTER FUNCTION public.update_video_narrations_timestamp()
  SET search_path = pg_catalog;

ALTER FUNCTION public.track_free_tier_usage()
  SET search_path = pg_catalog;
