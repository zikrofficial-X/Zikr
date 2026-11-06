create table if not exists public.video_likes (
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (video_id, user_id)
);

create index if not exists video_likes_user_id_idx
  on public.video_likes (user_id);

alter table public.video_likes enable row level security;

revoke all on table public.video_likes from anon, authenticated;
grant select, insert, delete on table public.video_likes to authenticated;

drop policy if exists "Users can read their own video likes" on public.video_likes;
create policy "Users can read their own video likes"
  on public.video_likes
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can like videos as themselves" on public.video_likes;
create policy "Users can like videos as themselves"
  on public.video_likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own video likes" on public.video_likes;
create policy "Users can remove their own video likes"
  on public.video_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.get_video_like_status(p_video_id uuid)
returns table(like_count bigint, viewer_liked boolean)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    count(*)::bigint as like_count,
    (count(*) filter (where user_id = auth.uid()) > 0) as viewer_liked
  from public.video_likes
  where video_id = p_video_id;
$$;

revoke all on function public.get_video_like_status(uuid) from public;
grant execute on function public.get_video_like_status(uuid) to anon, authenticated;
