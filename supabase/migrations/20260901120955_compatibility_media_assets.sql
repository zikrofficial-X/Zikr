-- Compatibility migration for the legacy media_assets schema.
-- The production database recorded this migration directly; keep the same
-- version locally so Supabase migration history remains consistent.
-- This migration is intentionally idempotent.

alter table if exists public.media_assets
  add column if not exists title text;

alter table if exists public.media_assets
  add column if not exists asset_type text;

alter table if exists public.media_assets
  add column if not exists verified_rights boolean;

alter table if exists public.media_assets
  add column if not exists width integer;

alter table if exists public.media_assets
  add column if not exists height integer;

alter table if exists public.media_assets
  add column if not exists duration_seconds integer;

alter table if exists public.media_assets
  add column if not exists alt_text_ar text;

update public.media_assets
set title = coalesce(title, name)
where title is null and name is not null;

update public.media_assets
set asset_type = coalesce(asset_type, media_type)
where asset_type is null and media_type is not null;

update public.media_assets
set verified_rights = coalesce(verified_rights, rights_verified, false)
where verified_rights is null;

create or replace function public.sync_media_asset_compat_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.title is null and new.name is not null then
    new.title := new.name;
  end if;

  if new.name is null and new.title is not null then
    new.name := new.title;
  end if;

  if new.asset_type is null and new.media_type is not null then
    new.asset_type := new.media_type;
  end if;

  if new.media_type is null and new.asset_type is not null then
    new.media_type := new.asset_type;
  end if;

  if new.verified_rights is null then
    new.verified_rights := coalesce(new.rights_verified, false);
  end if;

  if new.rights_verified is null then
    new.rights_verified := coalesce(new.verified_rights, false);
  end if;

  return new;
end;
$$;

drop trigger if exists media_assets_compat_sync on public.media_assets;

create trigger media_assets_compat_sync
before insert or update on public.media_assets
for each row
execute function public.sync_media_asset_compat_columns();
