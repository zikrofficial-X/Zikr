begin;

drop policy if exists "kids_content_public_read" on public.kids_content;

create policy "kids_content_public_read"
on public.kids_content
for select
to anon, authenticated
using (published is true and is_active is true);

commit;
