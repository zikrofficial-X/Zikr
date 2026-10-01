-- Backward-compatible repair for legacy media_assets schemas.
-- Existing deployments may have created media_assets before these relations
-- were introduced. Keep both columns nullable so existing rows remain valid.

alter table if exists public.media_assets
  add column if not exists source_id uuid;

alter table if exists public.media_assets
  add column if not exists created_by uuid;

do $$
begin
  if to_regclass('public.media_assets') is not null
     and to_regclass('public.content_sources') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'media_assets_source_id_fkey'
         and conrelid = 'public.media_assets'::regclass
     ) then
    alter table public.media_assets
      add constraint media_assets_source_id_fkey
      foreign key (source_id)
      references public.content_sources(id)
      on delete set null;
  end if;

  if to_regclass('public.media_assets') is not null
     and to_regclass('public.profiles') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'media_assets_created_by_fkey'
         and conrelid = 'public.media_assets'::regclass
     ) then
    alter table public.media_assets
      add constraint media_assets_created_by_fkey
      foreign key (created_by)
      references public.profiles(id)
      on delete set null;
  end if;
end;
$$;

create index if not exists media_assets_source_id_idx
  on public.media_assets (source_id);

create index if not exists media_assets_created_by_idx
  on public.media_assets (created_by);
