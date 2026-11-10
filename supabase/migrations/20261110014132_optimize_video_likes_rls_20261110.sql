-- Avoid per-row auth.uid() evaluation in video likes RLS policies.
drop policy if exists "Users can like videos as themselves" on public.video_likes;
create policy "Users can like videos as themselves"
  on public.video_likes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own video likes" on public.video_likes;
create policy "Users can read their own video likes"
  on public.video_likes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can remove their own video likes" on public.video_likes;
create policy "Users can remove their own video likes"
  on public.video_likes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
