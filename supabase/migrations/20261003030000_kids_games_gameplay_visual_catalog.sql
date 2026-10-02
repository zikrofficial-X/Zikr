-- ZIKR Kids Games 3.0: record the new gameplay and visual contracts.
-- Additive metadata only. Existing progress/results remain untouched.

with game_features(slug, features) as (
  values
    ('zikr-runner', array['animated-world','lane-free-run','difficulty-progression','combo','scenery-fx','daily-missions']::text[]),
    ('zikr-memory', array['verified-dhikr-pairs','scored-hints','animated-card-world','combo','daily-missions']::text[]),
    ('wudu-challenge', array['verified-wudu-content','step-progression','water-scene','streak','daily-missions']::text[]),
    ('verse-puzzle', array['verified-quran-source','hint-mechanic','indexed-word-order','library-scene','daily-missions']::text[]),
    ('zikr-quiz', array['verified-quiz','timed-round','fifty-fifty','streak','knowledge-scene','daily-missions']::text[]),
    ('mosque-adventure', array['interactive-map','learning-stations','animated-mosque-world','difficulty-progression','daily-missions']::text[]),
    ('zikr-road', array['lane-navigation','learning-checkpoints','road-scene','difficulty-progression','daily-missions']::text[]),
    ('zikr-jump', array['platform-physics','hazards','star-collection','night-sky-scene','daily-missions']::text[]),
    ('good-deeds', array['three-step-missions','values-learning','village-scene','progress-feedback','daily-missions']::text[]),
    ('hilal-fly', array['flight-physics','obstacle-gaps','star-collection','moon-sky-scene','daily-missions']::text[]),
    ('mosque-cleanup', array['tap-and-drag','sorting-zones','mistake-feedback','courtyard-scene','daily-missions']::text[]),
    ('zikr-coloring', array['svg-coloring','custom-color-mixing','local-gallery','creative-scene','daily-missions']::text[])
)
update public.kids_games g
set metadata = coalesce(g.metadata, '{}'::jsonb) || jsonb_build_object(
  'gameplayVersion', 3,
  'visualVersion', 3,
  'interactionVersion', 3,
  'featureSet', gf.features,
  'updatedFor', 'kids-games-3.0-20261003',
  'qualityContract', jsonb_build_object(
    'mobileFirst', true,
    'keyboardSupport', true,
    'offlineCompatible', true,
    'progressCompatible', true,
    'verifiedContentPreserved', true
  )
),
updated_at = now()
from game_features gf
where g.slug = gf.slug;