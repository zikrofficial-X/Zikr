-- Normalized Kids World progression. All tables are private to the authenticated owner.
create table if not exists public.kids_player_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp integer not null default 0 check (xp between 0 and 100000000),
  level smallint not null default 1 check (level between 1 and 10000),
  total_games integer not null default 0 check (total_games between 0 and 100000000),
  total_score bigint not null default 0 check (total_score between 0 and 100000000000),
  total_collectibles bigint not null default 0 check (total_collectibles between 0 and 100000000000),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.kids_game_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null,
  best_score integer not null default 0 check (best_score between 0 and 100000000),
  best_distance integer not null default 0 check (best_distance between 0 and 1000000000),
  best_level smallint not null default 0 check (best_level between 0 and 10000),
  play_count integer not null default 0 check (play_count between 0 and 100000000),
  best_combo integer not null default 0 check (best_combo between 0 and 100000000),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table if not exists public.kids_achievements (
  id text primary key,
  title_ar text not null,
  title_en text not null,
  description_ar text not null,
  description_en text not null,
  icon text not null,
  criteria jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.kids_user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.kids_achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create index if not exists kids_game_progress_game_score_idx on public.kids_game_progress (game_id, best_score desc);
create index if not exists kids_game_progress_user_updated_idx on public.kids_game_progress (user_id, updated_at desc);
create index if not exists kids_user_achievements_user_idx on public.kids_user_achievements (user_id, unlocked_at desc);

alter table public.kids_player_progress enable row level security;
alter table public.kids_game_progress enable row level security;
alter table public.kids_achievements enable row level security;
alter table public.kids_user_achievements enable row level security;

drop policy if exists "kids_player_progress_select_own" on public.kids_player_progress;
create policy "kids_player_progress_select_own" on public.kids_player_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "kids_game_progress_select_own" on public.kids_game_progress;
create policy "kids_game_progress_select_own" on public.kids_game_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "kids_achievements_public_read" on public.kids_achievements;
create policy "kids_achievements_public_read" on public.kids_achievements for select to anon, authenticated using (is_active = true);
drop policy if exists "kids_user_achievements_select_own" on public.kids_user_achievements;
create policy "kids_user_achievements_select_own" on public.kids_user_achievements for select to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.kids_player_progress from anon, authenticated;
revoke all on table public.kids_game_progress from anon, authenticated;
revoke all on table public.kids_user_achievements from anon, authenticated;
revoke insert, update, delete on table public.kids_achievements from anon, authenticated;
grant select on table public.kids_player_progress, public.kids_game_progress, public.kids_user_achievements to authenticated;
grant select on table public.kids_achievements to anon, authenticated;

insert into public.kids_achievements (id, title_ar, title_en, description_ar, description_en, icon, criteria)
values
  ('first-game', 'البداية الجميلة', 'First Game', 'أكمل أول لعبة في عالم ذِكر.', 'Complete your first Kids World game.', '✦', '{"kind":"games","value":1}'::jsonb),
  ('first-high-score', 'أول نتيجة عالية', 'First High Score', 'حقق نتيجة مميزة في إحدى الألعاب.', 'Set a first high score in a game.', '★', '{"kind":"high_score","value":1000}'::jsonb),
  ('points-1000', 'ألف نقطة', '1000 Points', 'اجمع ألف نقطة عبر ألعابك.', 'Reach 1,000 total points.', '◆', '{"kind":"total_score","value":1000}'::jsonb),
  ('points-5000', 'خمسة آلاف نقطة', '5000 Points', 'اجمع خمسة آلاف نقطة عبر ألعابك.', 'Reach 5,000 total points.', '◇', '{"kind":"total_score","value":5000}'::jsonb),
  ('play-5-games', 'صديق الألعاب', 'Play 5 Games', 'أكمل خمس جولات.', 'Complete five game rounds.', '☾', '{"kind":"games","value":5}'::jsonb),
  ('play-10-games', 'مستكشف العالم', 'Play 10 Games', 'أكمل عشر جولات.', 'Complete ten game rounds.', '⌂', '{"kind":"games","value":10}'::jsonb),
  ('collect-100-stars', 'مئة نجمة', '100 Stars', 'اجمع مئة نجمة في رحلتك.', 'Collect 100 stars.', '✧', '{"kind":"collectibles","value":100}'::jsonb),
  ('complete-wudu', 'متعلم الوضوء', 'Wudu Challenge Complete', 'أكمل تحدي الوضوء.', 'Complete Wudu Challenge.', '◌', '{"kind":"game_completed","game_id":"wudu-challenge"}'::jsonb),
  ('complete-puzzle', 'أول لغز', 'First Puzzle', 'أكمل أول لغز تعليمي.', 'Complete the first educational puzzle.', '۝', '{"kind":"game_completed","game_id":"verse-puzzle"}'::jsonb),
  ('perfect-memory', 'ذاكرة متألقة', 'Perfect Memory Round', 'أكمل جولة ذاكرة.', 'Complete a memory round.', '◆', '{"kind":"game_completed","game_id":"zikr-memory"}'::jsonb),
  ('quiz-streak', 'سلسلة المعرفة', 'Quiz Streak', 'حقق سلسلة إجابات في الاختبار.', 'Build a quiz streak.', '?', '{"kind":"combo","game_id":"zikr-quiz","value":3}'::jsonb)
on conflict (id) do update set title_ar = excluded.title_ar, title_en = excluded.title_en, description_ar = excluded.description_ar, description_en = excluded.description_en, icon = excluded.icon, criteria = excluded.criteria, is_active = true;

create or replace function public.kids_record_game_result(
  p_game_id text,
  p_client_submission_id text,
  p_score integer,
  p_collectibles integer,
  p_distance integer,
  p_difficulty text,
  p_xp_awarded smallint,
  p_level smallint,
  p_combo integer,
  p_completed boolean,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  result_id uuid,
  xp_awarded smallint,
  player_level smallint,
  duplicate boolean,
  newly_unlocked text[]
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_result public.kids_game_results%rowtype;
  v_duplicate boolean := false;
  v_new text[] := '{}';
  v_total_games integer;
  v_total_score bigint;
  v_total_collectibles bigint;
  v_best_score integer;
  v_level smallint;
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'authenticated user required'; end if;

  select * into v_result from public.kids_game_results where user_id = v_user_id and client_submission_id = p_client_submission_id limit 1;
  if v_result.id is not null then
    v_duplicate := true;
  else
    insert into public.kids_game_results (user_id, game_id, client_submission_id, score, collectibles, distance, xp_awarded, difficulty, metadata)
    values (v_user_id, p_game_id, p_client_submission_id, p_score, p_collectibles, p_distance, p_xp_awarded, p_difficulty, jsonb_build_object('level', p_level, 'combo', p_combo, 'completed', p_completed) || coalesce(p_metadata, '{}'::jsonb))
    returning * into v_result;

    insert into public.kids_game_progress (user_id, game_id, best_score, best_distance, best_level, play_count, best_combo, updated_at)
    values (v_user_id, p_game_id, p_score, p_distance, p_level, 1, p_combo, now())
    on conflict (user_id, game_id) do update set
      best_score = greatest(public.kids_game_progress.best_score, excluded.best_score),
      best_distance = greatest(public.kids_game_progress.best_distance, excluded.best_distance),
      best_level = greatest(public.kids_game_progress.best_level, excluded.best_level),
      play_count = public.kids_game_progress.play_count + 1,
      best_combo = greatest(public.kids_game_progress.best_combo, excluded.best_combo),
      updated_at = now();

    insert into public.kids_player_progress (user_id, xp, level, total_games, total_score, total_collectibles, updated_at)
    values (v_user_id, p_xp_awarded, 1, 1, p_score, p_collectibles, now())
    on conflict (user_id) do update set
      xp = least(100000000, public.kids_player_progress.xp + excluded.xp),
      total_games = public.kids_player_progress.total_games + 1,
      total_score = least(100000000000, public.kids_player_progress.total_score + excluded.total_score),
      total_collectibles = least(100000000000, public.kids_player_progress.total_collectibles + excluded.total_collectibles),
      updated_at = now();
  end if;

  select total_games, total_score, total_collectibles into v_total_games, v_total_score, v_total_collectibles from public.kids_player_progress where user_id = v_user_id;
  select best_score into v_best_score from public.kids_game_progress where user_id = v_user_id order by best_score desc limit 1;
  v_level := greatest(1, least(10000, 1 + floor(coalesce((select xp from public.kids_player_progress where user_id = v_user_id), 0) / 100)::integer));
  update public.kids_player_progress set level = v_level, updated_at = now() where user_id = v_user_id;

  insert into public.kids_user_achievements (user_id, achievement_id)
  select v_user_id, achievement_id from (values
    ('first-game', v_total_games >= 1), ('first-high-score', coalesce(v_best_score, 0) >= 1000), ('points-1000', v_total_score >= 1000), ('points-5000', v_total_score >= 5000), ('play-5-games', v_total_games >= 5), ('play-10-games', v_total_games >= 10), ('collect-100-stars', v_total_collectibles >= 100), ('complete-wudu', p_game_id = 'wudu-challenge' and p_completed), ('complete-puzzle', p_game_id = 'verse-puzzle' and p_completed), ('perfect-memory', p_game_id = 'zikr-memory' and p_completed), ('quiz-streak', p_game_id = 'zikr-quiz' and p_combo >= 3)
  ) as candidates(achievement_id, qualifies) where qualifies on conflict do nothing;

  select coalesce(array_agg(achievement_id order by achievement_id), '{}') into v_new from public.kids_user_achievements where user_id = v_user_id and unlocked_at >= now() - interval '2 seconds';
  return query select v_result.id, v_result.xp_awarded, v_level, v_duplicate, v_new;
end;
$$;

revoke all on function public.kids_record_game_result(text, text, integer, integer, integer, text, smallint, smallint, integer, boolean, jsonb) from public, anon;
grant execute on function public.kids_record_game_result(text, text, integer, integer, integer, text, smallint, smallint, integer, boolean, jsonb) to authenticated;
