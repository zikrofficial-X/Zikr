-- Restore only generated videos that were previously published on the site,
-- whose Cloudinary master was disposed after successful social publication, and
-- whose YouTube remote ID and automated QA can be independently reconciled.
-- Kids videos are restored only when the dedicated kids QA gate passed.
with confirmed as (
  select distinct on (v.id)
    v.id as video_id,
    q.metadata->'platformResults'->'youtube'->>'remoteId' as youtube_id,
    q.published_at as youtube_published_at
  from public.videos v
  join public.video_generation_requests r
    on r.id::text = v.metadata->>'videoGenerationRequestId'
  join public.social_publish_queue q
    on q.content_id = r.id::text
  where v.published = false
    and v.metadata->>'generator' = 'zikr_internal_video_factory'
    and v.metadata->>'mediaState' = 'purged'
    -- Queue history proves prior publication at some point, not that the item was
    -- still public when the purge ran. Legacy rows without this explicit provenance
    -- remain hidden until an administrator reviews and confirms them.
    and v.metadata->>'mediaPurgedFromPublished' = 'true'
    and q.status = 'published'
    and (q.content_type = 'video' or q.content_type like '%_video')
    and q.metadata ? 'videoDisposedAt'
    and q.metadata->'platformResults'->'youtube'->>'ok' = 'true'
    and q.metadata->'platformResults'->'youtube'->>'remoteId' ~ '^[A-Za-z0-9_-]{11}$'
    and (v.youtube_id is null or v.youtube_id = q.metadata->'platformResults'->'youtube'->>'remoteId')
    and r.status = 'completed'
    and r.content_hash = v.metadata->>'contentHash'
    and r.source_hash = v.metadata->>'sourceHash'
    and r.template_version = v.metadata->>'templateVersion'
    and v.metadata->'automatedVideoQa'->>'status' = 'passed'
    and (
      v.metadata->>'audience' = 'general'
      or (
        v.metadata->>'audience' = 'kids'
        and v.metadata->>'kidsVideoQaStatus' = 'passed'
      )
    )
    and exists (
      select 1
      from public.content_publish_queue cp
      where cp.content_table = 'videos'
        and cp.content_id = v.id
        and cp.status = 'published'
    )
  order by v.id, q.published_at desc nulls last
)
update public.videos v
set published = true,
    youtube_id = confirmed.youtube_id,
    thumbnail_url = 'https://i.ytimg.com/vi/' || confirmed.youtube_id || '/hqdefault.jpg',
    metadata = coalesce(v.metadata, '{}'::jsonb) || jsonb_build_object(
      'mediaState', 'youtube_fallback',
      'mediaFallbackAvailable', true,
      'mediaPurgedFromPublished', true,
      'youtubePublishedVideoId', confirmed.youtube_id,
      'youtubePublishedUrl', 'https://www.youtube.com/watch?v=' || confirmed.youtube_id,
      'youtubePublishedAt', coalesce(confirmed.youtube_published_at, now()),
      'mediaRecovery',
        coalesce(v.metadata->'mediaRecovery', '{}'::jsonb) || jsonb_build_object(
          'source', 'confirmed_youtube_publish_remote_id',
          'restoredAt', now(),
          'previousSitePublicationConfirmed', true,
          'previousCloudinaryMasterRetired', true
        )
    ),
    updated_at = now()
from confirmed
where v.id = confirmed.video_id
  and v.published is distinct from true;
