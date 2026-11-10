with kids_category as (
  select id from public.video_categories where slug = 'kids-stories' and published = true limit 1
),
linked_kids as (
  select
    v.id,
    v.slug,
    r.content,
    (
      r.content->>'audience' = 'kids'
      and r.content->>'aiMode' = 'original_kids_story'
      and r.content->>'sourceType' = 'original_kids_fiction'
      and nullif(btrim(r.content->>'seriesId'), '') is not null
      and nullif(btrim(r.content->>'seriesTitle'), '') is not null
      and nullif(btrim(r.content->>'learningObjective'), '') is not null
      and coalesce(r.content->'automatedVideoQa'->>'status', '') = 'passed'
      and coalesce(r.content->>'seasonNumber', '') ~ '^[1-9][0-9]*$'
      and coalesce(r.content->>'episodeNumber', '') ~ '^[1-9][0-9]*$'
    ) as kids_qa_ready
  from public.videos v
  join public.video_generation_requests r
    on r.id::text = v.metadata->>'videoGenerationRequestId'
  where v.published = true
    and v.metadata->>'generator' = 'zikr_internal_video_factory'
    and (
      r.content->>'audience' = 'kids'
      or r.content->>'curatedSourceId' like 'kids-series:%'
    )
)
update public.videos v
set category_id = (select id from kids_category),
    published = linked.kids_qa_ready,
    metadata = coalesce(v.metadata, '{}'::jsonb) || jsonb_build_object(
      'audience', 'kids',
      'publicPath', '/kids/videos/' || v.slug,
      'kidsVideoQaStatus', case when linked.kids_qa_ready then 'passed' else 'revalidation_required' end,
      'kidsVideoQaCheckedAt', now(),
      'kidsVideoQaReason', case
        when linked.kids_qa_ready then null
        else 'Legacy Kids episode lacks complete canonical series metadata and a passed Kids-specific automated QA snapshot; held from public playback.'
      end,
      'automatedVideoQa', linked.content->'automatedVideoQa',
      'approvalStatus', linked.content->>'approvalStatus',
      'qualityReview', linked.content->'qualityReview'
    ),
    updated_at = now()
from linked_kids linked
where v.id = linked.id
  and exists (select 1 from kids_category);
