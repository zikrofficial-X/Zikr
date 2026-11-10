-- Recover published catalog playback from confirmed YouTube provider IDs.
-- The prior cleanup removed temporary Cloudinary assets but left their stale URLs in
-- the public catalog. Only rows with a confirmed successful YouTube publish are changed.
with recoverable as (
  select
    v.id as video_id,
    q.metadata->'platformResults'->'youtube'->>'remoteId' as youtube_id
  from public.social_publish_queue q
  join public.video_generation_requests r on r.id::text = q.content_id
  join public.videos v on v.metadata->>'videoGenerationRequestId' = r.id::text
  where q.status = 'published'
    and q.metadata ? 'videoDisposedAt'
    and q.metadata->'platformResults'->'youtube'->>'ok' = 'true'
    and q.metadata->'platformResults'->'youtube'->>'remoteId' ~ '^[A-Za-z0-9_-]{11}$'
)
update public.videos v
set
  youtube_id = recoverable.youtube_id,
  thumbnail_url = 'https://i.ytimg.com/vi/' || recoverable.youtube_id || '/hqdefault.jpg',
  metadata = (coalesce(v.metadata, '{}'::jsonb) - 'generatedVideoUrl' - 'videoUrl' - 'video_url')
    || jsonb_build_object(
      'mediaState', 'youtube_fallback',
      'mediaRecovery', jsonb_build_object(
        'source', 'confirmed_youtube_publish_remote_id',
        'recoveredAt', now(),
        'previousCloudinaryMasterRetired', true
      )
    ),
  updated_at = now()
from recoverable
where v.id = recoverable.video_id
  and (v.youtube_id is distinct from recoverable.youtube_id
       or v.thumbnail_url is null
       or v.metadata ? 'generatedVideoUrl'
       or v.metadata ? 'videoUrl'
       or v.metadata ? 'video_url');
