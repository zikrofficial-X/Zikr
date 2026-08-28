-- Public source videos are readable by the site and writable only by admins.
-- The object path is still owner-scoped by the server-side presign endpoint.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  536870912,
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "video_assets_public_read" on storage.objects;
drop policy if exists "video_assets_admin_insert" on storage.objects;
drop policy if exists "video_assets_admin_update" on storage.objects;
drop policy if exists "video_assets_admin_delete" on storage.objects;

create policy "video_assets_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'videos');

create policy "video_assets_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'videos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "video_assets_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'videos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  bucket_id = 'videos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "video_assets_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'videos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
