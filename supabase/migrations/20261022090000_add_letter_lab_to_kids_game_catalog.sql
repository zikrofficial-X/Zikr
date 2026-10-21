-- Canonicalize Letter Lab in the Kids game catalog.
-- Additive and idempotent: preserves all existing game progress and results.

INSERT INTO public.kids_games (
  slug, title_ar, title_en, short_description_ar, description_ar, description_en,
  genre, age_min, age_max, difficulty, learning_objectives, engine, config,
  published, featured, order_index, mechanics, metadata, reward_xp
)
VALUES (
  'letter-lab',
  'مختبر الحروف',
  'Arabic Letter Lab',
  'لعبة تعليمية قصيرة للتعرف على الحروف العربية ومطابقتها.',
  'لعبة تعليمية قصيرة للتعرف على الحروف العربية ومطابقتها.',
  'A short educational game for recognizing and matching Arabic letters.',
  'educational',
  3, 5, 'easy',
  ARRAY['التعرف على الحروف العربية', 'مطابقة الحروف', 'القراءة والانتباه']::text[],
  'web',
  jsonb_build_object(
    'catalogVersion', 3,
    'version', 1,
    'levelCount', 30,
    'difficultyProfiles', jsonb_build_array('easy', 'normal', 'hard'),
    'controlScheme', 'tap',
    'world', 'letter-lab-world',
    'missionTypes', jsonb_build_array('accuracy', 'score', 'complete'),
    'learningObjective', 'مطابقة الحروف العربية'
  ),
  true, false, 12,
  ARRAY['letter-matching', 'recognition', 'attention']::text[],
  jsonb_build_object(
    'catalogVersion', 3,
    'gameId', 'letter-lab',
    'version', 1,
    'difficulty', 'easy',
    'category', 'لغة وتعلم',
    'objective', 'مطابقة الحروف العربية',
    'levelCount', 30,
    'difficultyProfiles', jsonb_build_array('easy', 'normal', 'hard')
  ),
  10
)
ON CONFLICT (slug) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  short_description_ar = EXCLUDED.short_description_ar,
  description_ar = EXCLUDED.description_ar,
  description_en = EXCLUDED.description_en,
  genre = EXCLUDED.genre,
  age_min = EXCLUDED.age_min,
  age_max = EXCLUDED.age_max,
  difficulty = EXCLUDED.difficulty,
  learning_objectives = EXCLUDED.learning_objectives,
  engine = EXCLUDED.engine,
  config = COALESCE(public.kids_games.config, '{}'::jsonb) || EXCLUDED.config,
  published = EXCLUDED.published,
  featured = EXCLUDED.featured,
  order_index = EXCLUDED.order_index,
  mechanics = EXCLUDED.mechanics,
  metadata = COALESCE(public.kids_games.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  reward_xp = EXCLUDED.reward_xp,
  updated_at = now();

-- Keep the database catalog order aligned with GAME_REGISTRY.
UPDATE public.kids_games
SET order_index = 13, updated_at = now()
WHERE slug = 'zikr-coloring';

WITH game AS (
  SELECT id FROM public.kids_games WHERE slug = 'letter-lab'
),
levels AS (
  SELECT generate_series(1, 30)::integer AS level_no
),
difficulties AS (
  SELECT unnest(ARRAY['easy', 'normal', 'hard']::text[]) AS difficulty
),
titles AS (
  SELECT ARRAY[
    'حرف البداية', 'ألوان الحروف', 'رف الحروف', 'ممر الأبجدية',
    'بطاقات صغيرة', 'مختبر الأصوات', 'حديقة الكلمات', 'تحدي التركيز',
    'ساحة القراءة', 'بوابة الحروف', 'نجوم اللغة', 'محطة الإتقان'
  ]::text[] AS names
)
INSERT INTO public.kids_game_levels (
  game_id, level_no, title_ar, title_en, description_ar, objective_ar,
  objective_en, mechanic, difficulty, reward_xp, reward_badge, config, published
)
SELECT
  game.id,
  level.level_no,
  titles.names[((level.level_no - 1) % array_length(titles.names, 1)) + 1] || ' ' || level.level_no,
  'Level ' || level.level_no,
  'مرحلة ' || level.level_no || ' من مختبر الحروف العربية.',
  'تعرّف على الحرف المطلوب وطابقه مع الاختيار الصحيح.',
  'Identify the requested Arabic letter and match it with the correct choice.',
  CASE WHEN level.level_no % 3 = 1 THEN 'letter-recognition'
       WHEN level.level_no % 3 = 2 THEN 'letter-matching'
       ELSE 'letter-focus' END,
  difficulty.difficulty,
  12 + (level.level_no * 2)
    + CASE difficulty.difficulty WHEN 'normal' THEN 4 WHEN 'hard' THEN 8 ELSE 0 END,
  CASE WHEN level.level_no = 30 THEN 'letter-lab-' || difficulty.difficulty || '-level-30' ELSE NULL END,
  jsonb_build_object(
    'catalogVersion', 3,
    'levelNo', level.level_no,
    'difficulty', difficulty.difficulty,
    'choiceCount', CASE difficulty.difficulty WHEN 'easy' THEN 3 WHEN 'normal' THEN 4 ELSE 5 END,
    'distractorCount', CASE difficulty.difficulty WHEN 'easy' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
    'pattern', ((level.level_no - 1) % 8),
    'palette', ((level.level_no - 1) % 12),
    'replayable', true
  ),
  true
FROM game
CROSS JOIN levels AS level
CROSS JOIN difficulties AS difficulty
CROSS JOIN titles
ON CONFLICT (game_id, difficulty, level_no)
DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  description_ar = EXCLUDED.description_ar,
  objective_ar = EXCLUDED.objective_ar,
  objective_en = EXCLUDED.objective_en,
  mechanic = EXCLUDED.mechanic,
  reward_xp = EXCLUDED.reward_xp,
  reward_badge = EXCLUDED.reward_badge,
  config = COALESCE(public.kids_game_levels.config, '{}'::jsonb) || EXCLUDED.config,
  published = EXCLUDED.published,
  updated_at = now();

DO $$
DECLARE configured_levels integer;
BEGIN
  SELECT count(*) INTO configured_levels
  FROM public.kids_game_levels AS level
  JOIN public.kids_games AS game ON game.id = level.game_id
  WHERE game.slug = 'letter-lab'
    AND level.published IS TRUE
    AND level.level_no BETWEEN 1 AND 30
    AND level.difficulty IN ('easy', 'normal', 'hard');

  IF configured_levels <> 90 THEN
    RAISE EXCEPTION 'Letter Lab catalog expected 90 published levels, found %', configured_levels;
  END IF;
END;
$$;
