-- Keep the runtime metadata attached to published Kids content in sync with GAME_REGISTRY.
-- Merge rather than replace so each activity retains its category, safety note, and learning metadata.
WITH canonical_games(slug, version, difficulty) AS (
  VALUES
    ('zikr-runner', 2, 'easy'),
    ('zikr-memory', 2, 'easy'),
    ('wudu-challenge', 2, 'easy'),
    ('verse-puzzle', 2, 'easy'),
    ('zikr-quiz', 2, 'easy'),
    ('mosque-adventure', 2, 'easy'),
    ('zikr-road', 2, 'easy'),
    ('zikr-jump', 2, 'easy'),
    ('good-deeds', 2, 'easy'),
    ('hilal-fly', 2, 'easy'),
    ('mosque-cleanup', 2, 'easy'),
    ('zikr-coloring', 2, 'easy')
)
UPDATE public.kids_content AS item
SET metadata = COALESCE(item.metadata, '{}'::jsonb) || jsonb_build_object(
  'gameId', canonical_games.slug,
  'version', canonical_games.version,
  'difficulty', canonical_games.difficulty
),
updated_at = now()
FROM canonical_games
WHERE item.slug = canonical_games.slug
  AND item.type = 'game'
  AND (
    item.metadata ->> 'gameId' IS DISTINCT FROM canonical_games.slug
    OR item.metadata ->> 'version' IS DISTINCT FROM canonical_games.version::text
    OR item.metadata ->> 'difficulty' IS DISTINCT FROM canonical_games.difficulty
  );
