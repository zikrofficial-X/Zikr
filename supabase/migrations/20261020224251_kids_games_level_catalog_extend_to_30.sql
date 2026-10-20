-- ZIKR Kids Games: extend the canonical level catalog from 20 to 30.
-- Additive and idempotent; existing scores, achievements, progress and history stay untouched.

insert into public.kids_game_levels (
  game_id, level_no, title_ar, title_en, description_ar, objective_ar, objective_en,
  mechanic, difficulty, reward_xp, reward_badge, config, published
)
select
  source.game_id,
  levels.level_no,
  regexp_replace(source.title_ar, '\s+[0-9]+$', '') || ' ' || levels.level_no,
  'Level ' || levels.level_no,
  'مرحلة ' || levels.level_no || ' من المسار المتدرج للعبة.',
  source.objective_ar,
  source.objective_en,
  source.mechanic,
  source.difficulty,
  12 + (levels.level_no * 2)
    + case source.difficulty when 'normal' then 4 when 'hard' then 8 else 0 end,
  case when levels.level_no = 30 then game.slug || '-' || source.difficulty || '-level-30' else null end,
  coalesce(source.config, '{}'::jsonb) || jsonb_build_object(
    'catalogVersion', 3,
    'levelNo', levels.level_no,
    'difficulty', source.difficulty,
    'paceMultiplier', round((0.92 + (levels.level_no * 0.018) + case source.difficulty when 'normal' then 0.12 when 'hard' then 0.24 else 0 end)::numeric, 3),
    'densityMultiplier', round((0.86 + ((levels.level_no - 1) % 9) * 0.055 + case source.difficulty when 'normal' then 0.08 when 'hard' then 0.16 else 0 end)::numeric, 3),
    'pattern', ((levels.level_no - 1) % 8),
    'palette', ((levels.level_no - 1) % 12),
    'replayable', true
  ),
  true
from public.kids_game_levels as source
join public.kids_games as game on game.id = source.game_id
cross join generate_series(21, 30) as levels(level_no)
where source.level_no = ((levels.level_no - 1) % 20) + 1
on conflict (game_id, difficulty, level_no)
do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  description_ar = excluded.description_ar,
  objective_ar = excluded.objective_ar,
  objective_en = excluded.objective_en,
  mechanic = excluded.mechanic,
  reward_xp = excluded.reward_xp,
  reward_badge = excluded.reward_badge,
  config = excluded.config,
  published = excluded.published,
  updated_at = now();

update public.kids_games
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'catalogVersion', 3,
  'levelCount', 30,
  'difficultyProfiles', jsonb_build_array('easy', 'normal', 'hard'),
  'replayable', true
),
updated_at = now()
where slug = any(array[
  'zikr-runner', 'zikr-memory', 'wudu-challenge', 'verse-puzzle',
  'zikr-quiz', 'mosque-adventure', 'zikr-road', 'zikr-jump',
  'good-deeds', 'hilal-fly', 'mosque-cleanup', 'zikr-coloring'
]::text[]);
