-- Restore least-privilege owner-scoped Storage access for user-managed buckets.
-- Bucket visibility and limits remain controlled by supabase/config.toml.
-- The path owner segment is written by buildStoragePath(user.id, filename).
-- Public buckets stay public for delivery; these policies only authorize owner API access.

drop policy if exists "user_storage_select_own" on storage.objects;
drop policy if exists "user_storage_insert_own" on storage.objects;
drop policy if exists "user_storage_update_own" on storage.objects;
drop policy if exists "user_storage_delete_own" on storage.objects;

create policy "user_storage_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('avatars', 'media', 'audio', 'documents')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "user_storage_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('avatars', 'media', 'audio', 'documents')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "user_storage_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('avatars', 'media', 'audio', 'documents')
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id in ('avatars', 'media', 'audio', 'documents')
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "user_storage_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('avatars', 'media', 'audio', 'documents')
  and auth.uid()::text = (storage.foldername(name))[1]
);
