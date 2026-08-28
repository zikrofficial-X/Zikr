-- Deduplicate Quran references created by the initial full-passage expansion.
-- Keep every source URL, but store each range once per prophet.
with deduped as (
  select
    p.id,
    coalesce(jsonb_agg(distinct reference_value), '[]'::jsonb) as source_refs
  from public.prophets p
  left join lateral jsonb_array_elements(
    coalesce(p.metadata->'references', '[]'::jsonb)
  ) as refs(reference_value) on true
  where p.metadata->>'story_mode' = 'full_quran_passages'
  group by p.id
)
update public.prophets p
set metadata = jsonb_set(
  coalesce(p.metadata, '{}'::jsonb),
  '{references}',
  d.source_refs,
  true
)
from deduped d
where p.id = d.id;
