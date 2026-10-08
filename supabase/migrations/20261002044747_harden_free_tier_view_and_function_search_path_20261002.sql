-- Security hardening for legacy free-tier objects.
-- Clean Preview databases may not contain the retired legacy subsystem, so all
-- ALTER statements are conditional on the target relation/function existing.
DO $migration$
BEGIN
  IF to_regclass('public.free_tier_statistics') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.free_tier_statistics SET (security_invoker = true)';
  END IF;

  IF to_regprocedure('public.update_kids_game_progress_timestamp()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_kids_game_progress_timestamp() SET search_path = pg_catalog';
  END IF;

  IF to_regprocedure('public.update_kids_character_selection_timestamp()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_kids_character_selection_timestamp() SET search_path = pg_catalog';
  END IF;

  IF to_regprocedure('public.update_game_scenarios_timestamp()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_game_scenarios_timestamp() SET search_path = pg_catalog';
  END IF;

  IF to_regprocedure('public.update_game_graphics_timestamp()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_game_graphics_timestamp() SET search_path = pg_catalog';
  END IF;

  IF to_regprocedure('public.update_video_narrations_timestamp()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_video_narrations_timestamp() SET search_path = pg_catalog';
  END IF;

  IF to_regprocedure('public.track_free_tier_usage()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.track_free_tier_usage() SET search_path = pg_catalog';
  END IF;
END
$migration$;
