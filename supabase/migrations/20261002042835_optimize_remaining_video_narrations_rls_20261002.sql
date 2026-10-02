-- Remote migration: 20261002042835
drop policy if exists "Admins only can manage video narrations" on public.video_narrations;
create policy "Admins only can manage video narrations" on public.video_narrations for all to public
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role));
