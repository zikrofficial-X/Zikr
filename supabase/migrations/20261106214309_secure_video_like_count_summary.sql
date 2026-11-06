create table if not exists public.video_like_counts (
  video_id uuid primary key references public.videos(id) on delete cascade,
  like_count bigint not null default 0 check (like_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.video_like_counts enable row level security;
revoke all on table public.video_like_counts from public, anon, authenticated;
grant select on table public.video_like_counts to anon, authenticated;

drop policy if exists "Public can read video like totals" on public.video_like_counts;
create policy "Public can read video like totals"
  on public.video_like_counts
  for select
  to anon, authenticated
  using (true);

insert into public.video_like_counts (video_id, like_count)
select video_id, count(*)::bigint
from public.video_likes
group by video_id
on conflict (video_id) do update
set like_count = excluded.like_count, updated_at = now();

create or replace function public.maintain_video_like_count()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.video_like_counts (video_id, like_count, updated_at)
    values (new.video_id, 1, now())
    on conflict (video_id) do update
      set like_count = public.video_like_counts.like_count + 1,
          updated_at = now();
    return new;
  elsif tg_op = 'DELETE' then
    update public.video_like_counts
       set like_count = greatest(like_count - 1, 0),
           updated_at = now()
     where video_id = old.video_id;
    return old;
  end if;
  return null;
end;
$$;

revoke all on function public.maintain_video_like_count() from public, anon, authenticated;

drop trigger if exists maintain_video_like_count_after_insert on public.video_likes;
create trigger maintain_video_like_count_after_insert
  after insert on public.video_likes
  for each row execute function public.maintain_video_like_count();

drop trigger if exists maintain_video_like_count_after_delete on public.video_likes;
create trigger maintain_video_like_count_after_delete
  after delete on public.video_likes
  for each row execute function public.maintain_video_like_count();

revoke all on function public.get_video_like_status(uuid) from public, anon, authenticated;
drop function if exists public.get_video_like_status(uuid);
