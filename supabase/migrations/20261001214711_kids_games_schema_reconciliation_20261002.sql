-- ZIKR Kids Games schema reconciliation and runtime hardening.
-- Repairs the destructive 20260929 modernization drift without changing player-facing APIs.
-- The legacy achievement shape is retained under a private compatibility table.

BEGIN;

ALTER TABLE public.kids_game_progress
  ADD COLUMN IF NOT EXISTS best_distance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_level smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS play_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_combo integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level_no integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.kids_game_progress
  DROP CONSTRAINT IF EXISTS kids_game_progress_user_id_fkey;

ALTER TABLE public.kids_game_progress
  ADD CONSTRAINT kids_game_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS kids_game_progress_user_game_unique
  ON public.kids_game_progress (user_id, game_id);

CREATE INDEX IF NOT EXISTS kids_game_progress_game_score_idx
  ON public.kids_game_progress (game_id, best_score DESC);

CREATE INDEX IF NOT EXISTS kids_game_progress_user_updated_idx
  ON public.kids_game_progress (user_id, updated_at DESC);

ALTER TABLE public.kids_game_results
  ADD COLUMN IF NOT EXISTS client_submission_id text,
  ADD COLUMN IF NOT EXISTS distance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_awarded smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS played_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.kids_game_results
  DROP CONSTRAINT IF EXISTS kids_game_results_user_id_fkey,
  DROP CONSTRAINT IF EXISTS kids_game_results_difficulty_check,
  DROP CONSTRAINT IF EXISTS kids_game_results_score_check,
  DROP CONSTRAINT IF EXISTS kids_game_results_collectibles_check,
  DROP CONSTRAINT IF EXISTS kids_game_results_distance_check,
  DROP CONSTRAINT IF EXISTS kids_game_results_xp_check,
  DROP CONSTRAINT IF EXISTS kids_game_results_client_submission_id_check;

ALTER TABLE public.kids_game_results
  ALTER COLUMN client_submission_id SET NOT NULL;

ALTER TABLE public.kids_game_results
  ADD CONSTRAINT kids_game_results_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT kids_game_results_difficulty_check
    CHECK (difficulty IN ('easy', 'normal', 'hard')),
  ADD CONSTRAINT kids_game_results_score_check
    CHECK (score BETWEEN 0 AND 100000),
  ADD CONSTRAINT kids_game_results_collectibles_check
    CHECK (collectibles BETWEEN 0 AND 10000),
  ADD CONSTRAINT kids_game_results_distance_check
    CHECK (distance BETWEEN 0 AND 1000000),
  ADD CONSTRAINT kids_game_results_xp_check
    CHECK (xp_awarded BETWEEN 0 AND 100),
  ADD CONSTRAINT kids_game_results_client_submission_id_check
    CHECK (char_length(client_submission_id) BETWEEN 8 AND 100);

CREATE UNIQUE INDEX IF NOT EXISTS kids_game_results_user_client_unique
  ON public.kids_game_results (user_id, client_submission_id);

CREATE INDEX IF NOT EXISTS kids_game_results_user_game_idx
  ON public.kids_game_results (user_id, game_id);

CREATE INDEX IF NOT EXISTS kids_game_results_game_score_idx
  ON public.kids_game_results (game_id, score DESC);

CREATE INDEX IF NOT EXISTS kids_game_results_game_played_at_idx
  ON public.kids_game_results (game_id, played_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'kids_achievements'
      AND column_name = 'user_id'
  ) THEN
    IF to_regclass('public.kids_achievements_legacy_20261002') IS NULL THEN
      ALTER TABLE public.kids_achievements
        RENAME TO kids_achievements_legacy_20261002;
    ELSE
      DROP TABLE public.kids_achievements;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.kids_achievements (
  id text PRIMARY KEY,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  icon text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kids_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kids_achievements_public_read ON public.kids_achievements;
CREATE POLICY kids_achievements_public_read
  ON public.kids_achievements
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
REVOKE ALL ON TABLE public.kids_achievements FROM anon, authenticated;
GRANT SELECT ON TABLE public.kids_achievements TO anon, authenticated;

INSERT INTO public.kids_achievements
  (id, title_ar, title_en, description_ar, description_en, icon, criteria, is_active)
VALUES
  ('first-game', 'البداية الجميلة', 'First Game', 'أكمل أول لعبة في عالم ذِكر.', 'Complete your first Kids World game.', '✦', '{"kind":"games","value":1}'::jsonb, true),
  ('first-high-score', 'أول نتيجة عالية', 'First High Score', 'حقق نتيجة مميزة في إحدى الألعاب.', 'Set a first high score in a game.', '★', '{"kind":"high_score","value":1000}'::jsonb, true),
  ('points-1000', 'ألف نقطة', '1000 Points', 'اجمع ألف نقطة عبر ألعابك.', 'Reach 1,000 total points.', '◆', '{"kind":"total_score","value":1000}'::jsonb, true),
  ('points-5000', 'خمسة آلاف نقطة', '5000 Points', 'اجمع خمسة آلاف نقطة عبر ألعابك.', 'Reach 5,000 total points.', '◇', '{"kind":"total_score","value":5000}'::jsonb, true),
  ('play-5-games', 'صديق الألعاب', 'Play 5 Games', 'أكمل خمس جولات.', 'Complete five game rounds.', '☾', '{"kind":"games","value":5}'::jsonb, true),
  ('play-10-games', 'مستكشف العالم', 'Play 10 Games', 'أكمل عشر جولات.', 'Complete ten game rounds.', '⌂', '{"kind":"games","value":10}'::jsonb, true),
  ('collect-100-stars', 'مئة نجمة', '100 Stars', 'اجمع مئة نجمة في رحلتك.', 'Collect 100 stars.', '✧', '{"kind":"collectibles","value":100}'::jsonb, true),
  ('complete-wudu', 'متعلم الوضوء', 'Wudu Challenge Complete', 'أكمل تحدي الوضوء.', 'Complete Wudu Challenge.', '◌', '{"kind":"game_completed","game_id":"wudu-challenge"}'::jsonb, true),
  ('complete-puzzle', 'أول لغز', 'First Puzzle', 'أكمل أول لغز تعليمي.', 'Complete the first educational puzzle.', '۝', '{"kind":"game_completed","game_id":"verse-puzzle"}'::jsonb, true),
  ('perfect-memory', 'ذاكرة متألقة', 'Perfect Memory Round', 'أكمل جولة ذاكرة.', 'Complete a memory round.', '◆', '{"kind":"game_completed","game_id":"zikr-memory"}'::jsonb, true),
  ('quiz-streak', 'سلسلة المعرفة', 'Quiz Streak', 'حقق سلسلة إجابات في الاختبار.', 'Build a quiz streak.', '?', '{"kind":"combo","game_id":"zikr-quiz","value":3}'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  description_ar = EXCLUDED.description_ar,
  description_en = EXCLUDED.description_en,
  icon = EXCLUDED.icon,
  criteria = EXCLUDED.criteria,
  is_active = EXCLUDED.is_active;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'kids_user_achievements_achievement_id_fkey'
      AND conrelid = 'public.kids_user_achievements'::regclass
  ) THEN
    ALTER TABLE public.kids_user_achievements
      ADD CONSTRAINT kids_user_achievements_achievement_id_fkey
      FOREIGN KEY (achievement_id)
      REFERENCES public.kids_achievements(id)
      ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.kids_user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kids_user_achievements_select_own ON public.kids_user_achievements;
CREATE POLICY kids_user_achievements_select_own
  ON public.kids_user_achievements
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
REVOKE ALL ON TABLE public.kids_user_achievements FROM anon, authenticated;
GRANT SELECT ON TABLE public.kids_user_achievements TO authenticated;
CREATE INDEX IF NOT EXISTS kids_user_achievements_achievement_idx
  ON public.kids_user_achievements (achievement_id);

ALTER TABLE public.kids_games
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS mechanics text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reward_xp integer NOT NULL DEFAULT 10;

ALTER TABLE public.kids_game_levels
  ADD COLUMN IF NOT EXISTS title_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS objective_en text;

ALTER TABLE public.kids_game_questions
  ADD COLUMN IF NOT EXISTS question_ar text,
  ADD COLUMN IF NOT EXISTS question_en text,
  ADD COLUMN IF NOT EXISTS options_ar text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS options_en text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS explanation_en text,
  ADD COLUMN IF NOT EXISTS question_no integer NOT NULL DEFAULT 0;

INSERT INTO public.kids_games
  (slug, title_ar, title_en, short_description_ar, description_ar, description_en,
   genre, age_min, age_max, difficulty, learning_objectives, engine,
   config, published, featured, order_index, mechanics, metadata, reward_xp)
VALUES
  ('zikr-runner', 'ذِكر رانر', 'ZIKR Runner', 'لعبة حركة قصيرة', 'اجمع النجوم وتجاوز العوائق في رحلة تعليمية آمنة.', 'Collect stars and avoid hazards in a gentle learning journey.', 'action', 6, 12, 'easy', ARRAY['التركيز','ردة الفعل'], 'phaser', '{}'::jsonb, true, true, 1, ARRAY['runner','collect'], '{"runtimeKind":"runner","source":"canonical-registry"}'::jsonb, 100),
  ('zikr-memory', 'ذاكرة ذِكر', 'ZIKR Memory', 'لعبة ذاكرة قصيرة', 'طابق البطاقات وتعلم من المواقف اليومية.', 'Match themed cards and learn from daily situations.', 'memory', 3, 12, 'easy', ARRAY['الذاكرة','الانتباه'], 'react', '{}'::jsonb, true, false, 2, ARRAY['memory','matching'], '{"runtimeKind":"memory","source":"canonical-registry"}'::jsonb, 100),
  ('wudu-challenge', 'تحدي الوضوء', 'Wudu Challenge', 'تعلم الترتيب الصحيح', 'رتب خطوات الوضوء من المحتوى التعليمي المعتمد.', 'Arrange wudu steps from approved educational content.', 'educational', 6, 12, 'easy', ARRAY['التسلسل','التعلم'], 'react', '{}'::jsonb, true, false, 3, ARRAY['ordering','education'], '{"runtimeKind":"ordering","source":"canonical-registry"}'::jsonb, 100),
  ('verse-puzzle', 'لغز الآية', 'Verse Puzzle', 'لغز قرآني دقيق', 'رتب كلمات من نص قرآني موثق دون تغيير النص.', 'Arrange words from verified Quran text without altering it.', 'puzzle', 9, 12, 'easy', ARRAY['القراءة','التركيز'], 'react', '{}'::jsonb, true, false, 4, ARRAY['verse','ordering'], '{"runtimeKind":"verse","source":"canonical-registry"}'::jsonb, 100),
  ('zikr-quiz', 'اختبار ذِكر', 'ZIKR Quiz', 'أسئلة تعليمية قصيرة', 'أجب عن أسئلة قصيرة من المحتوى التعليمي الموثق.', 'Answer short questions from verified educational content.', 'learning', 6, 12, 'easy', ARRAY['التذكر','الفهم'], 'react', '{}'::jsonb, true, false, 5, ARRAY['quiz','learning'], '{"runtimeKind":"quiz","source":"canonical-registry"}'::jsonb, 100),
  ('mosque-adventure', 'مغامرة المسجد', 'Mosque Adventure', 'استكشاف تعليمي آمن', 'استكشف خريطة خيالية واجمع أهداف التعلم بأمان.', 'Explore a fictional map and complete safe learning objectives.', 'adventure', 6, 12, 'easy', ARRAY['الاستكشاف','اتخاذ القرار'], 'phaser', '{}'::jsonb, true, false, 6, ARRAY['adventure','exploration'], '{"runtimeKind":"adventure","source":"canonical-registry"}'::jsonb, 100),
  ('zikr-road', 'طريق ذِكر', 'ZIKR Road', 'طريق حركة قصير', 'تجنب العوائق وتوقف عند أسئلة التعلم القصيرة.', 'Avoid hazards and pause for short learning questions.', 'action', 6, 12, 'easy', ARRAY['الانتباه','القرار'], 'phaser', '{}'::jsonb, true, false, 7, ARRAY['road','arcade'], '{"runtimeKind":"road","source":"canonical-registry"}'::jsonb, 100),
  ('zikr-jump', 'قفزة ذِكر', 'ZIKR Jump', 'توقيت ومنصات', 'اقفز بين المنصات واجمع نجوم التعلم.', 'Jump between platforms and collect learning stars.', 'action', 6, 12, 'easy', ARRAY['التوقيت','التوازن'], 'phaser', '{}'::jsonb, true, false, 8, ARRAY['jump','platform'], '{"runtimeKind":"jump","source":"canonical-registry"}'::jsonb, 100),
  ('good-deeds', 'أعمال الخير', 'Good Deeds', 'مهمة قيمية اختيارية', 'اختر مهمة تعليمية اختيارية داخل عالم اللعبة.', 'Choose an optional educational task inside the game world.', 'learning', 3, 12, 'easy', ARRAY['القيم','التعاون'], 'react', '{}'::jsonb, true, false, 9, ARRAY['good-deeds','choice'], '{"runtimeKind":"good-deeds","source":"canonical-registry"}'::jsonb, 100),
  ('hilal-fly', 'طيران الهلال', 'Hilal Fly', 'أركيد هادئ', 'حرك الهلال اللطيف بين العوائق واجمع النجوم.', 'Guide a friendly crescent between obstacles and collect stars.', 'action', 6, 12, 'easy', ARRAY['التنسيق البصري'], 'phaser', '{}'::jsonb, true, false, 10, ARRAY['fly','arcade'], '{"runtimeKind":"fly","source":"canonical-registry"}'::jsonb, 100),
  ('mosque-cleanup', 'ترتيب المكان', 'Mosque Cleanup', 'ترتيب عناصر خيالية', 'رتب بيئة خيالية نظيفة ومحترمة باللمس أو السحب.', 'Sort a clean fictional environment by tapping or dragging.', 'learning', 6, 12, 'easy', ARRAY['التصنيف','الترتيب'], 'react', '{}'::jsonb, true, false, 11, ARRAY['cleanup','sorting'], '{"runtimeKind":"cleanup","source":"canonical-registry"}'::jsonb, 100),
  ('zikr-coloring', 'تلوين ذِكر', 'ZIKR Coloring', 'تلوين إبداعي محلي', 'لون رسومات أصلية واحفظها على جهازك دون حساب.', 'Color original illustrations and save them locally without an account.', 'creativity', 3, 12, 'easy', ARRAY['الإبداع','التعبير'], 'react', '{}'::jsonb, true, false, 12, ARRAY['coloring','creative'], '{"runtimeKind":"coloring","source":"canonical-registry"}'::jsonb, 100)
ON CONFLICT (slug) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  description_ar = EXCLUDED.description_ar,
  description_en = EXCLUDED.description_en,
  age_min = EXCLUDED.age_min,
  age_max = EXCLUDED.age_max,
  difficulty = EXCLUDED.difficulty,
  learning_objectives = EXCLUDED.learning_objectives,
  engine = EXCLUDED.engine,
  mechanics = EXCLUDED.mechanics,
  metadata = EXCLUDED.metadata,
  reward_xp = EXCLUDED.reward_xp,
  published = true;

CREATE OR REPLACE FUNCTION public.kids_record_game_result_internal(
  p_user_id uuid,
  p_game_id text,
  p_client_submission_id text,
  p_score integer,
  p_collectibles integer,
  p_distance integer,
  p_difficulty text,
  p_level smallint,
  p_combo integer,
  p_completed boolean,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (result_id uuid, xp_awarded smallint, player_level smallint, duplicate boolean, newly_unlocked text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.kids_game_results%ROWTYPE;
  v_duplicate boolean := false;
  v_new text[] := '{}';
  v_total_games integer := 0;
  v_total_score bigint := 0;
  v_total_collectibles bigint := 0;
  v_best_score integer := 0;
  v_level smallint := 1;
  v_xp_awarded smallint;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION USING errcode = '42501', message = 'user id required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.kids_games WHERE slug = p_game_id AND published = true) THEN
    RAISE EXCEPTION USING errcode = '22023', message = 'unsupported game id';
  END IF;
  IF p_client_submission_id IS NULL OR length(p_client_submission_id) < 8 OR length(p_client_submission_id) > 100 THEN
    RAISE EXCEPTION USING errcode = '22023', message = 'invalid submission id';
  END IF;
  IF coalesce(p_score, -1) < 0 OR coalesce(p_collectibles, -1) < 0 OR coalesce(p_distance, -1) < 0 THEN
    RAISE EXCEPTION USING errcode = '22023', message = 'negative result values are not allowed';
  END IF;
  IF p_score > 100000 OR p_collectibles > 10000 OR p_distance > 1000000 THEN
    RAISE EXCEPTION USING errcode = '22023', message = 'result exceeds global game limits';
  END IF;

  v_xp_awarded := least(
    100,
    floor(greatest(0, p_score)::numeric / 250)
      + least(20, floor(greatest(0, p_collectibles)::numeric / 5))
      + floor(greatest(0, p_distance)::numeric / 2000)
      + case when coalesce(p_completed, false) then 10 else 0 end
  )::smallint;

  SELECT * INTO v_result
  FROM public.kids_game_results
  WHERE user_id = p_user_id AND client_submission_id = p_client_submission_id
  LIMIT 1;

  IF v_result.id IS NOT NULL THEN
    v_duplicate := true;
  ELSE
    INSERT INTO public.kids_game_results
      (user_id, game_id, client_submission_id, score, collectibles, distance, xp_awarded, difficulty, metadata, played_at, updated_at)
    VALUES
      (p_user_id, p_game_id, p_client_submission_id, p_score, p_collectibles, p_distance, v_xp_awarded,
       coalesce(nullif(p_difficulty, ''), 'easy'),
       jsonb_build_object(
         'level', least(100, greatest(0, coalesce(p_level, 0))),
         'combo', least(10000, greatest(0, coalesce(p_combo, 0))),
         'completed', coalesce(p_completed, false)
       ) || coalesce(p_metadata, '{}'::jsonb),
       now(), now())
    RETURNING * INTO v_result;

    INSERT INTO public.kids_game_progress
      (user_id, game_id, best_score, best_distance, best_level, play_count, best_combo, level_no, xp, updated_at, total_plays, last_played_at)
    VALUES
      (p_user_id, p_game_id, p_score, p_distance,
       least(100, greatest(0, coalesce(p_level, 0))), 1,
       least(10000, greatest(0, coalesce(p_combo, 0))),
       least(100, greatest(0, coalesce(p_level, 0))), v_xp_awarded, now(), 1, now())
    ON CONFLICT (user_id, game_id) DO UPDATE SET
      best_score = greatest(public.kids_game_progress.best_score, EXCLUDED.best_score),
      best_distance = greatest(public.kids_game_progress.best_distance, EXCLUDED.best_distance),
      best_level = greatest(public.kids_game_progress.best_level, EXCLUDED.best_level),
      play_count = public.kids_game_progress.play_count + 1,
      best_combo = greatest(public.kids_game_progress.best_combo, EXCLUDED.best_combo),
      level_no = greatest(public.kids_game_progress.level_no, EXCLUDED.level_no),
      xp = least(100000000, public.kids_game_progress.xp + EXCLUDED.xp),
      total_plays = public.kids_game_progress.total_plays + 1,
      last_played_at = now(),
      updated_at = now();

    INSERT INTO public.kids_player_progress
      (user_id, xp, level, total_games, total_score, total_collectibles, updated_at)
    VALUES
      (p_user_id, v_xp_awarded, 1, 1, p_score, p_collectibles, now())
    ON CONFLICT (user_id) DO UPDATE SET
      xp = least(100000000, public.kids_player_progress.xp + EXCLUDED.xp),
      total_games = public.kids_player_progress.total_games + 1,
      total_score = least(100000000000, public.kids_player_progress.total_score + EXCLUDED.total_score),
      total_collectibles = least(100000000000, public.kids_player_progress.total_collectibles + EXCLUDED.total_collectibles),
      updated_at = now();
  END IF;

  SELECT total_games, total_score, total_collectibles
    INTO v_total_games, v_total_score, v_total_collectibles
  FROM public.kids_player_progress
  WHERE user_id = p_user_id;

  SELECT coalesce(max(best_score), 0)
    INTO v_best_score
  FROM public.kids_game_progress
  WHERE user_id = p_user_id;

  v_level := greatest(
    1,
    least(
      10000,
      1 + floor(coalesce((SELECT xp FROM public.kids_player_progress WHERE user_id = p_user_id), 0) / 100)::integer
    )
  );

  UPDATE public.kids_player_progress
  SET level = v_level, updated_at = now()
  WHERE user_id = p_user_id;

  WITH candidates(achievement_id, qualifies) AS (
    VALUES
      ('first-game', v_total_games >= 1),
      ('first-high-score', v_best_score >= 1000),
      ('points-1000', v_total_score >= 1000),
      ('points-5000', v_total_score >= 5000),
      ('play-5-games', v_total_games >= 5),
      ('play-10-games', v_total_games >= 10),
      ('collect-100-stars', v_total_collectibles >= 100),
      ('complete-wudu', p_game_id = 'wudu-challenge' AND coalesce(p_completed, false)),
      ('complete-puzzle', p_game_id = 'verse-puzzle' AND coalesce(p_completed, false)),
      ('perfect-memory', p_game_id = 'zikr-memory' AND coalesce(p_completed, false)),
      ('quiz-streak', p_game_id = 'zikr-quiz' AND coalesce(p_combo, 0) >= 3)
  ),
  inserted AS (
    INSERT INTO public.kids_user_achievements (user_id, achievement_id)
    SELECT p_user_id, achievement_id
    FROM candidates
    WHERE qualifies
    ON CONFLICT DO NOTHING
    RETURNING achievement_id
  )
  SELECT coalesce(array_agg(achievement_id ORDER BY achievement_id), '{}')
    INTO v_new
  FROM inserted;

  RETURN QUERY
  SELECT v_result.id, v_result.xp_awarded, v_level, v_duplicate, v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.kids_record_game_result_internal(uuid, text, text, integer, integer, integer, text, smallint, integer, boolean, jsonb)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kids_record_game_result_internal(uuid, text, text, integer, integer, integer, text, smallint, integer, boolean, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.kids_record_game_result(
  p_game_id text,
  p_client_submission_id text,
  p_score integer,
  p_collectibles integer,
  p_distance integer,
  p_difficulty text,
  p_xp_awarded smallint,
  p_level smallint,
  p_combo integer,
  p_completed boolean,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (result_id uuid, xp_awarded smallint, player_level smallint, duplicate boolean, newly_unlocked text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING errcode = '42501', message = 'authenticated user required';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.kids_record_game_result_internal(
    auth.uid(), p_game_id, p_client_submission_id, p_score, p_collectibles,
    p_distance, p_difficulty, p_level, p_combo, p_completed, p_metadata
  );
END;
$$;

REVOKE ALL ON FUNCTION public.kids_record_game_result(
  text, text, integer, integer, integer, text, smallint, smallint, integer, boolean, jsonb
) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kids_record_game_result(
  text, text, integer, integer, integer, text, smallint, smallint, integer, boolean, jsonb
) TO service_role;

COMMIT;
