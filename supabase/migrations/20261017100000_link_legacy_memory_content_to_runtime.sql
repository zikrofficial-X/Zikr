-- Connect the original daily-dhikr memory activity page to the canonical game runtime.
-- Preserve the original educational content, safety notes, and existing metadata.
UPDATE public.kids_content
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'gameId', 'zikr-memory',
  'version', 2,
  'difficulty', 'easy'
),
updated_at = now()
WHERE slug = 'game-memory-dhikr-cards'
  AND type = 'game'
  AND (
    metadata ->> 'gameId' IS DISTINCT FROM 'zikr-memory'
    OR metadata ->> 'version' IS DISTINCT FROM '2'
    OR metadata ->> 'difficulty' IS DISTINCT FROM 'easy'
  );
