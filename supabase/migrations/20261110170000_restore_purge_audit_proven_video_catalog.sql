-- Restore only generated videos that can be proven to have been public immediately before
-- the exact 2026-11-10 purge event. The old purge route set published=false for every
-- internal generated catalog row while preserving the historical site/social queues.
-- This forward migration reconstructs that provenance only when the row's mediaPurgedAt
-- and updated_at fall inside the recorded purge window, both site and social publication
-- timestamps predate the event, Cloudinary disposal predates the event, the YouTube remote
-- ID is confirmed, generation hashes match, and automated/Kids QA passed.
--
-- Expected production evidence at authoring time: 50 general + 8 Kids rows.
-- Any drift fails closed before changing a single catalog row. No queue or user data is deleted.

create temporary table _zikr_purge_proven_video_recovery
on commit drop
as
with purge_event as (
  select id, created_at
  from public.admin_audit_events
  where id = 'b97b0756-3e4c-4a43-aec8-a42686ab1682'
    and action = 'video.library.purge'
    and resource_type = 'generated_video_library'
    and metadata->>'scope' = 'files'
    and (metadata->>'catalogRecordsHidden')::integer = 105
    and (metadata->>'physicalFilesDeleted')::boolean is true
    and (metadata->>'cloudinaryAssetsDeleted')::integer = 44
),
confirmed as (
  select distinct on (v.id)
    v.id as video_id,
    v.metadata->>'audience' as audience,
    q.metadata->'platformResults'->'youtube'->>'remoteId' as youtube_id,
    q.published_at as youtube_published_at,
    purge_event.id as audit_event_id,
    purge_event.created_at as purge_at
  from public.videos v
  cross join purge_event
  join public.video_generation_requests r
    on r.id::text = v.metadata->>'videoGenerationRequestId'
  join public.social_publish_queue q
    on q.content_id = r.id::text
  where v.published is false
    and v.metadata->>'generator' = 'zikr_internal_video_factory'
    and v.metadata->>'mediaState' = 'purged'
    and v.updated_at between purge_event.created_at - interval '15 seconds'
                         and purge_event.created_at + interval '15 seconds'
    and pg_input_is_valid(v.metadata->>'mediaPurgedAt', 'timestamp with time zone')
    and case
      when pg_input_is_valid(v.metadata->>'mediaPurgedAt', 'timestamp with time zone')
        then (v.metadata->>'mediaPurgedAt')::timestamptz
      else null
    end between purge_event.created_at - interval '15 seconds'
              and purge_event.created_at + interval '15 seconds'
    and q.status = 'published'
    and (q.content_type = 'video' or q.content_type like '%_video')
    and q.published_at is not null
    and q.published_at <= purge_event.created_at
    and q.metadata ? 'videoDisposedAt'
    and pg_input_is_valid(q.metadata->>'videoDisposedAt', 'timestamp with time zone')
    and case
      when pg_input_is_valid(q.metadata->>'videoDisposedAt', 'timestamp with time zone')
        then (q.metadata->>'videoDisposedAt')::timestamptz
      else null
    end <= purge_event.created_at
    and q.metadata->'platformResults'->'youtube'->>'ok' = 'true'
    and q.metadata->'platformResults'->'youtube'->>'remoteId' ~ '^[A-Za-z0-9_-]{11}$'
    and (v.youtube_id is null or v.youtube_id = q.metadata->'platformResults'->'youtube'->>'remoteId')
    and not exists (
      select 1
      from public.videos existing_video
      where existing_video.id <> v.id
        and existing_video.youtube_id = q.metadata->'platformResults'->'youtube'->>'remoteId'
    )
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
        and cp.published_at is not null
        and cp.published_at <= purge_event.created_at
    )
  order by v.id, q.published_at desc nulls last
)
select * from confirmed;

do $$
declare
  candidate_count integer;
  general_count integer;
  kids_count integer;
  candidate_youtube_id_count integer;
  already_restored_count integer;
  already_restored_general integer;
  already_restored_kids integer;
  already_restored_unique_youtube_ids integer;
  already_restored_youtube_collisions integer;
  updated_count integer;
  purge_event_count integer;
begin
  select count(*) into purge_event_count
  from public.admin_audit_events
  where id = 'b97b0756-3e4c-4a43-aec8-a42686ab1682';

  if purge_event_count = 0 then
    raise notice 'Exact production purge audit event is absent; no catalog rows restored in this environment.';
    return;
  end if;

  select
    count(*),
    count(*) filter (where audience = 'general'),
    count(*) filter (where audience = 'kids'),
    count(distinct youtube_id)
  into candidate_count, general_count, kids_count, candidate_youtube_id_count
  from pg_temp._zikr_purge_proven_video_recovery;

  if candidate_count = 58 and general_count = 50 and kids_count = 8 and candidate_youtube_id_count = 58 then
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
          'youtubePublishedAt', confirmed.youtube_published_at,
          'mediaRecovery',
            coalesce(v.metadata->'mediaRecovery', '{}'::jsonb) || jsonb_build_object(
              'source', 'confirmed_pre_purge_site_and_social_publication',
              'restoredAt', now(),
              'auditEventId', confirmed.audit_event_id,
              'purgeEventAt', confirmed.purge_at,
              'previousSitePublicationConfirmed', true,
              'previousSocialPublicationConfirmed', true,
              'previousCloudinaryMasterRetired', true
            )
        ),
        updated_at = now()
    from pg_temp._zikr_purge_proven_video_recovery confirmed
    where v.id = confirmed.video_id
      and v.published is false
      and v.metadata->>'mediaState' = 'purged';

    get diagnostics updated_count = row_count;
    if updated_count <> 58 then
      raise exception 'Purge-proven video recovery expected 58 catalog updates, updated %.', updated_count;
    end if;
  elsif candidate_count = 0 then
    select
      count(*),
      count(*) filter (where metadata->>'audience' = 'general'),
      count(*) filter (where metadata->>'audience' = 'kids'),
      count(distinct youtube_id),
      (
        select count(*)
        from public.videos restored
        join public.videos existing_video
          on existing_video.youtube_id = restored.youtube_id
         and existing_video.id <> restored.id
        where restored.published is true
          and restored.metadata->>'generator' = 'zikr_internal_video_factory'
          and restored.metadata->>'mediaState' = 'youtube_fallback'
          and restored.metadata->'mediaRecovery'->>'auditEventId' = 'b97b0756-3e4c-4a43-aec8-a42686ab1682'
          and restored.metadata->>'mediaPurgedFromPublished' = 'true'
      )
    into already_restored_count, already_restored_general, already_restored_kids,
         already_restored_unique_youtube_ids, already_restored_youtube_collisions
    from public.videos
    where published is true
      and metadata->>'generator' = 'zikr_internal_video_factory'
      and metadata->>'mediaState' = 'youtube_fallback'
      and metadata->'mediaRecovery'->>'auditEventId' = 'b97b0756-3e4c-4a43-aec8-a42686ab1682'
      and metadata->>'mediaPurgedFromPublished' = 'true';

    if already_restored_count = 58
       and already_restored_general = 50
       and already_restored_kids = 8
       and already_restored_unique_youtube_ids = 58
       and already_restored_youtube_collisions = 0 then
      raise notice 'Purge-proven video catalog recovery was already applied; no changes made.';
    else
      raise exception 'Purge-proven video recovery expected 58 candidates (50 general, 8 Kids) and 58 unique YouTube IDs; found % candidates, % unique IDs; already restored % (general %, Kids %, unique IDs %, collisions %). Refusing to change public catalog.',
        candidate_count, candidate_youtube_id_count, already_restored_count, already_restored_general, already_restored_kids, already_restored_unique_youtube_ids, already_restored_youtube_collisions;
    end if;
  else
    raise exception 'Purge-proven video recovery expected 58 candidates (50 general, 8 Kids) with 58 unique YouTube IDs and no existing video-ID collisions; found % (general %, Kids %, unique IDs %). Refusing to change public catalog.',
      candidate_count, general_count, kids_count, candidate_youtube_id_count;
  end if;
end;
$$;
