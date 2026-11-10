with published_youtube as (
  select distinct on (q.content_id)
    q.content_id,
    q.metadata->'platformResults'->'youtube'->>'remoteId' as youtube_id,
    q.published_at
  from public.social_publish_queue q
  where q.status = 'published'
    and q.content_id is not null
    and (q.content_type = 'video' or q.content_type like '%_video')
    and q.metadata->'platformResults'->'youtube'->>'ok' = 'true'
    and q.metadata->'platformResults'->'youtube'->>'remoteId' ~ '^[A-Za-z0-9_-]{6,20}$'
  order by q.content_id, q.published_at desc nulls last
)
update public.videos v
set youtube_id = p.youtube_id,
    metadata = coalesce(v.metadata, '{}'::jsonb) || jsonb_build_object(
      'youtubePublishedVideoId', p.youtube_id,
      'youtubePublishedUrl', 'https://www.youtube.com/watch?v=' || p.youtube_id,
      'youtubePublishedAt', coalesce(p.published_at, now()),
      'mediaFallbackAvailable', true
    ),
    updated_at = now()
from published_youtube p
where v.published = true
  and v.metadata->>'generator' = 'zikr_internal_video_factory'
  and v.metadata->>'videoGenerationRequestId' = p.content_id
  and (v.youtube_id is null or v.youtube_id = '');
