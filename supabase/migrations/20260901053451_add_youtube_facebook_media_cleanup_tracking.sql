do $$
begin
  if to_regclass('public.social_sync_jobs') is not null then
    alter table public.social_sync_jobs
      add column if not exists source_media_deleted_at timestamptz null,
      add column if not exists source_media_delete_error text null;

    create index if not exists social_sync_jobs_media_cleanup_idx
      on public.social_sync_jobs (status, source_media_deleted_at, source_media_uploaded_at)
      where source_media_path is not null and facebook_post_id is not null;
  end if;
end $$;
