-- Enforce Kids game result contracts at the database boundary as well as the API.
-- This is additive: existing results and player progress are preserved.

CREATE OR REPLACE FUNCTION public.kids_validate_game_result_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_score integer;
  v_max_collectibles integer;
  v_max_distance integer;
  v_recent_count integer;
  v_allowed_keys text[] := ARRAY[
    'level', 'combo', 'completed', 'source', 'runtime',
    'dailyMissionId', 'dailyMissionCompleted', 'roundTimeSeconds',
    'mistakes', 'accuracy'
  ];
BEGIN
  IF NEW.game_id NOT IN (
    'zikr-runner', 'zikr-memory', 'wudu-challenge', 'verse-puzzle',
    'zikr-quiz', 'mosque-adventure', 'zikr-road', 'zikr-jump',
    'good-deeds', 'hilal-fly', 'mosque-cleanup', 'letter-lab', 'zikr-coloring'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'unsupported game id';
  END IF;

  v_max_score := CASE NEW.game_id
    WHEN 'zikr-memory' THEN 50000
    WHEN 'verse-puzzle' THEN 50000
    WHEN 'mosque-adventure' THEN 50000
    WHEN 'zikr-coloring' THEN 50000
    ELSE 100000
  END;
  v_max_collectibles := CASE NEW.game_id
    WHEN 'zikr-runner' THEN 10000
    WHEN 'zikr-road' THEN 10000
    WHEN 'zikr-jump' THEN 10000
    WHEN 'hilal-fly' THEN 10000
    WHEN 'letter-lab' THEN 100
    ELSE 500
  END;
  v_max_distance := CASE NEW.game_id
    WHEN 'zikr-runner' THEN 1000000
    WHEN 'zikr-road' THEN 1000000
    WHEN 'hilal-fly' THEN 1000000
    WHEN 'mosque-adventure' THEN 100000
    WHEN 'zikr-jump' THEN 100000
    ELSE 0
  END;

  IF NEW.score NOT BETWEEN 0 AND v_max_score
    OR NEW.collectibles NOT BETWEEN 0 AND v_max_collectibles
    OR NEW.distance NOT BETWEEN 0 AND v_max_distance THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'game result exceeds per-game limits';
  END IF;

  IF NEW.difficulty NOT IN ('easy', 'normal', 'hard') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid game difficulty';
  END IF;

  IF jsonb_typeof(NEW.metadata) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'game result metadata must be an object';
  END IF;
  IF jsonb_object_length(NEW.metadata) > 10
    OR pg_column_size(NEW.metadata) > 4096
    OR EXISTS (
      SELECT 1
      FROM jsonb_object_keys(NEW.metadata) AS metadata_keys(key)
      WHERE key <> ALL(v_allowed_keys)
    ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid game result metadata';
  END IF;

  -- Serialize the per-user counter to avoid concurrent requests bypassing the cap.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));
  SELECT count(*) INTO v_recent_count
  FROM public.kids_game_results
  WHERE user_id = NEW.user_id
    AND created_at >= now() - interval '1 minute';

  IF v_recent_count >= 60 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'kids game result rate limit exceeded';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kids_game_results_validate_insert
  ON public.kids_game_results;
CREATE TRIGGER kids_game_results_validate_insert
  BEFORE INSERT ON public.kids_game_results
  FOR EACH ROW
  EXECUTE FUNCTION public.kids_validate_game_result_insert();

REVOKE ALL ON FUNCTION public.kids_validate_game_result_insert()
  FROM PUBLIC, anon, authenticated;
