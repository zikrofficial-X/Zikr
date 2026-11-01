DO $$
DECLARE
  v_user uuid := '11111111-1111-4111-8111-111111111111';
  v_rate_user uuid := '22222222-2222-4222-8222-222222222222';
  v_rejected boolean;
  v_created_at timestamptz;
  v_rate_blocked boolean := false;
  i integer;
BEGIN
  INSERT INTO public.kids_game_results (
    user_id, game_id, score, collectibles, distance, difficulty,
    client_submission_id, metadata, created_at
  ) VALUES (
    v_user, 'zikr-runner', 1200, 4, 250, 'normal', 'valid-submission-001',
    jsonb_build_object(
      'level', 3, 'combo', 2, 'completed', true, 'source', 'kids-world',
      'runtime', 'runner', 'dailyMissionId', 'daily-1',
      'dailyMissionCompleted', true, 'roundTimeSeconds', 45,
      'mistakes', 0, 'accuracy', 100
    ),
    NULL
  ) RETURNING created_at INTO v_created_at;

  IF v_created_at IS NULL THEN
    RAISE EXCEPTION 'created_at was not normalized';
  END IF;

  v_rejected := false;
  BEGIN
    INSERT INTO public.kids_game_results (
      user_id, game_id, score, collectibles, distance, difficulty,
      client_submission_id, metadata
    ) VALUES (
      v_user, 'zikr-memory', 50001, 0, 0, 'easy', 'bad-score-0001', '{}'::jsonb
    );
  EXCEPTION WHEN SQLSTATE '22023' THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'per-game score ceiling was not enforced'; END IF;

  v_rejected := false;
  BEGIN
    INSERT INTO public.kids_game_results (
      user_id, game_id, score, collectibles, distance, difficulty,
      client_submission_id, metadata
    ) VALUES (
      v_user, 'zikr-memory', 100, 0, 1, 'easy', 'bad-distance-001', '{}'::jsonb
    );
  EXCEPTION WHEN SQLSTATE '22023' THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'non-distance game accepted a distance'; END IF;

  v_rejected := false;
  BEGIN
    INSERT INTO public.kids_game_results (
      user_id, game_id, score, collectibles, distance, difficulty,
      client_submission_id, metadata
    ) VALUES (
      v_user, 'zikr-runner', 100, NULL, 1, 'easy', 'null-count-0001', '{}'::jsonb
    );
  EXCEPTION WHEN SQLSTATE '22023' THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'NULL collectibles were not rejected'; END IF;

  v_rejected := false;
  BEGIN
    INSERT INTO public.kids_game_results (
      user_id, game_id, score, collectibles, distance, difficulty,
      client_submission_id, metadata
    ) VALUES (
      v_user, 'zikr-runner', 100, 0, 1, NULL, 'null-diff-000001', '{}'::jsonb
    );
  EXCEPTION WHEN SQLSTATE '22023' THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'NULL difficulty was not rejected'; END IF;

  v_rejected := false;
  BEGIN
    INSERT INTO public.kids_game_results (
      user_id, game_id, score, collectibles, distance, difficulty,
      client_submission_id, metadata
    ) VALUES (
      v_user, 'zikr-runner', 100, 0, 1, 'easy', 'bad-meta-000001',
      '{"notApproved":true}'::jsonb
    );
  EXCEPTION WHEN SQLSTATE '22023' THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'unapproved metadata keys were not rejected'; END IF;

  v_rejected := false;
  BEGIN
    INSERT INTO public.kids_game_results (
      user_id, game_id, score, collectibles, distance, difficulty,
      client_submission_id, metadata
    ) VALUES (
      v_user, 'zikr-runner', 100, 0, 1, 'easy', 'large-meta-00001',
      jsonb_build_object('source', repeat('x', 5000))
    );
  EXCEPTION WHEN SQLSTATE '22023' THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'oversized metadata was not rejected'; END IF;

  v_rejected := false;
  BEGIN
    INSERT INTO public.kids_game_results (
      user_id, game_id, score, collectibles, distance, difficulty,
      client_submission_id, metadata
    ) VALUES (
      v_user, 'not-a-registered-game', 100, 0, 0, 'easy', 'bad-game-000001', '{}'::jsonb
    );
  EXCEPTION WHEN SQLSTATE '22023' THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'unsupported game ID was not rejected'; END IF;

  FOR i IN 1..60 LOOP
    INSERT INTO public.kids_game_results (
      user_id, game_id, score, collectibles, distance, difficulty,
      client_submission_id, metadata
    ) VALUES (
      v_rate_user, 'zikr-runner', 10, 0, 1, 'easy', 'rate-limit-' || lpad(i::text, 3, '0'),
      jsonb_build_object(
        'level', 1, 'combo', 0, 'completed', false, 'source', 'kids-world',
        'runtime', 'runner', 'dailyMissionId', 'daily-1',
        'dailyMissionCompleted', false, 'roundTimeSeconds', 10,
        'mistakes', 0, 'accuracy', 100
      )
    );
  END LOOP;

  BEGIN
    INSERT INTO public.kids_game_results (
      user_id, game_id, score, collectibles, distance, difficulty,
      client_submission_id, metadata
    ) VALUES (
      v_rate_user, 'zikr-runner', 10, 0, 1, 'easy', 'rate-limit-061',
      jsonb_build_object(
        'level', 1, 'combo', 0, 'completed', false, 'source', 'kids-world',
        'runtime', 'runner', 'dailyMissionId', 'daily-1',
        'dailyMissionCompleted', false, 'roundTimeSeconds', 10,
        'mistakes', 0, 'accuracy', 100
      )
    );
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM = 'kids game result rate limit exceeded' THEN
      v_rate_blocked := true;
    ELSE
      RAISE;
    END IF;
  END;

  IF NOT v_rate_blocked THEN RAISE EXCEPTION 'per-user 60-per-minute rate guard did not reject result 61'; END IF;

  IF has_function_privilege('anon', 'public.kids_validate_game_result_insert()', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon unexpectedly has EXECUTE on the trigger function';
  END IF;
  IF has_function_privilege('authenticated', 'public.kids_validate_game_result_insert()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated unexpectedly has EXECUTE on the trigger function';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.kids_validate_game_result_insert()', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role lacks EXECUTE on the trigger function';
  END IF;
END;
$$;

SELECT 'KIDS_GAME_DB_TRIGGER_INTEGRATION_PASSED' AS result;
