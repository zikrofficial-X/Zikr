-- Record verifiable story completeness metadata without changing religious text.
-- The canonical content remains the Quran passages assembled from quran_ayahs.
update public.prophets p
set metadata = coalesce(p.metadata, '{}'::jsonb)
  || jsonb_build_object(
    'story_version', 'quran_primary_v1',
    'story_section_count', stats.section_count,
    'story_char_count', stats.char_count,
    'story_completeness', case when stats.char_count > 0 then 'full_quran_passages' else 'missing' end,
    'content_status', case when stats.char_count > 0 then 'quran_primary' else 'needs_review' end
  )
from (
  select prophet_id,
         count(*)::integer as section_count,
         coalesce(sum(char_length(content_ar)), 0)::integer as char_count
  from public.prophet_sections
  group by prophet_id
) stats
where p.id = stats.prophet_id;

create index if not exists prophets_story_completeness_idx
  on public.prophets ((metadata->>'story_completeness'));
