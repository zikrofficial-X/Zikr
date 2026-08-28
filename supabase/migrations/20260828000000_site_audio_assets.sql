-- Admin-managed audio used by the prayer call and salawat reminder.
create table if not exists public.site_audio_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('adhan', 'salawat')),
  title text not null check (char_length(trim(title)) between 1 and 120),
  storage_path text not null unique,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 52428800),
  is_primary boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists site_audio_assets_one_primary_per_kind
  on public.site_audio_assets(kind) where is_primary;

create index if not exists site_audio_assets_kind_created_at_idx
  on public.site_audio_assets(kind, created_at desc);

alter table public.site_audio_assets enable row level security;

create policy site_audio_assets_admin_insert on public.site_audio_assets
  for insert to authenticated with check (private.is_admin_user());
create policy site_audio_assets_admin_update on public.site_audio_assets
  for update to authenticated using (private.is_admin_user()) with check (private.is_admin_user());
create policy site_audio_assets_admin_delete on public.site_audio_assets
  for delete to authenticated using (private.is_admin_user());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-audio', 'site-audio', true, 52428800,
  array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/webm']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy site_audio_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-audio');
create policy site_audio_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'site-audio' and private.is_admin_user());
create policy site_audio_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'site-audio' and private.is_admin_user());
