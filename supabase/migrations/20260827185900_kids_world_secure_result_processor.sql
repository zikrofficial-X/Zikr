-- Replace the exposed authenticated result processor with a server-only entry point.
-- The application authenticates the user with the cookie-bound anon client, then
-- invokes this function through createAdminClient() using the server-derived UUID.
-- XP is derived here so it cannot be supplied or inflated by a client.

create or replace function public.kids_record_game_result_internal(
  p_user_id uuid,
  p_game_id text,
  p_client_submission_id text,
  p_score integer,
  p_collectibles integer,
  p_distance integer,
  p_difficulty text,
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
security definer
set search_path = public
as $$
declare
  v_result public.kids_game_results%rowtype;
  v_duplicate boolean := false;
  v_new text[] := '{}';
  v_total_games integer;
  v_total_score bigint;
  v_total_collectibles bigint;
  v_best_score integer;
  v_level smallint;
  v_xp_awarded smallint;
begin
  if p_user_id is null then
    raise exception using errcode = '42501', message = 'user id required';
  end if;

  if p_game_id not in (
    'zikr-runner', 'zikr-memory', 'wudu-challenge', 'verse-puzzle',
    'zikr-quiz', 'mosque-adventure', 'zikr-road', 'zikr-jump',
    'good-deeds', 'hilal-fly', 'mosque-cleanup', 'zikr-coloring'
  ) then
    raise exception using errcode = '22023', message = 'unsupported game id';
  end if;

  if p_client_submission_id is null or length(p_client_submission_id) < 8 or length(p_client_submission_id) > 100 then
    raise exception using errcode = '22023', message = 'invalid submission id';
  end if;

  if coalesce(p_score, -1) < 0 or coalesce(p_collectibles, -1) < 0 or coalesce(p_distance, -1) < 0 then
    raise exception using errcode = '22023', message = 'negative result values are not allowed';
  end if;

  -- Keep the SQL boundary defensive even though the API already enforces the
  -- per-game bounds. These are the largest registry limits, not client XP.
  if p_score > 100000 or p_collectibles > 10000 or p_distance > 1000000 then
    raise exception using errcode = '22023', message = 'result exceeds global game limits';
  end if;

  v_xp_awarded := least(
    100,
    floor(greatest(0, p_score)::numeric / 250)
      + least(20, floor(greatest(0, p_collectibles)::numeric / 5))
      + floor(greatest(0, p_distance)::numeric / 2000)
      + case when coalesce(p_completed, false) then 10 else 0 end
  )::smallint;

  select * into v_result
  from public.kids_game_results
  where user_id = p_user_id and client_submission_id = p_client_submission_id
  limit 1;

  if v_result.id is not null then
    v_duplicate := true;
  else
    insert into public.kids_game_results (
      user_id, game_id, client_submission_id, score, collectibles, distance,
      xp_awarded, difficulty, metadata
    )
    values (
      p_user_id, p_game_id, p_client_submission_id, p_score, p_collectibles,
      p_distance, v_xp_awarded, coalesce(nullif(p_difficulty, ''), 'easy'),
      jsonb_build_object(
        'level', least(100, greatest(0, coalesce(p_level, 0))),
        'combo', least(10000, greatest(0, coalesce(p_combo, 0))),
        'completed', coalesce(p_completed, false)
      ) || coalesce(p_metadata, '{}'::jsonb)
    )
    returning * into v_result;

    insert into public.kids_game_progress (
      user_id, game_id, best_score, best_distance, best_level,
      play_count, best_combo, updated_at
    )
    values (
      p_user_id, p_game_id, p_score, p_distance,
      least(100, greatest(0, coalesce(p_level, 0))), 1,
      least(10000, greatest(0, coalesce(p_combo, 0))), now()
    )
    on conflict (user_id, game_id) do update set
      best_score = greatest(public.kids_game_progress.best_score, excluded.best_score),
      best_distance = greatest(public.kids_game_progress.best_distance, excluded.best_distance),
      best_level = greatest(public.kids_game_progress.best_level, excluded.best_level),
      play_count = public.kids_game_progress.play_count + 1,
      best_combo = greatest(public.kids_game_progress.best_combo, excluded.best_combo),
      updated_at = now();

    insert into public.kids_player_progress (
      user_id, xp, level, total_games, total_score, total_collectibles, updated_at
    )
    values (p_user_id, v_xp_awarded, 1, 1, p_score, p_collectibles, now())
    on conflict (user_id) do update set
      xp = least(100000000, public.kids_player_progress.xp + excluded.xp),
      total_games = public.kids_player_progress.total_games + 1,
      total_score = least(100000000000, public.kids_player_progress.total_score + excluded.total_score),
      total_collectibles = least(100000000000, public.kids_player_progress.total_collectibles + excluded.total_collectibles),
      updated_at = now();
  end if;

  select total_games, total_score, total_collectibles
    into v_total_games, v_total_score, v_total_collectibles
  from public.kids_player_progress
  where user_id = p_user_id;

  select best_score into v_best_score
  from public.kids_game_progress
  where user_id = p_user_id
  order by best_score desc
  limit 1;

  v_level := greatest(
    1,
    least(
      10000,
      1 + floor(coalesce((select xp from public.kids_player_progress where user_id = p_user_id), 0) / 100)::integer
    )
  );
  update public.kids_player_progress
  set level = v_level, updated_at = now()
  where user_id = p_user_id;

  insert into public.kids_user_achievements (user_id, achievement_id)
  select p_user_id, achievement_id
  from (values
    ('first-game', v_total_games >= 1),
    ('first-high-score', coalesce(v_best_score, 0) >= 1000),
    ('points-1000', v_total_score >= 1000),
    ('points-5000', v_total_score >= 5000),
    ('play-5-games', v_total_games >= 5),
    ('play-10-games', v_total_games >= 10),
    ('collect-100-stars', v_total_collectibles >= 100),
    ('complete-wudu', p_game_id = 'wudu-challenge' and coalesce(p_completed, false)),
    ('complete-puzzle', p_game_id = 'verse-puzzle' and coalesce(p_completed, false)),
    ('perfect-memory', p_game_id = 'zikr-memory' and coalesce(p_completed, false)),
    ('quiz-streak', p_game_id = 'zikr-quiz' and coalesce(p_combo, 0) >= 3)
  ) as candidates(achievement_id, qualifies)
  where qualifies
  on conflict do nothing;

  select coalesce(array_agg(achievement_id order by achievement_id), '{}')
    into v_new
  from public.kids_user_achievements
  where user_id = p_user_id and unlocked_at >= now() - interval '2 seconds';

  return query select v_result.id, v_result.xp_awarded, v_level, v_duplicate, v_new;
end;
$$;

revoke all on function public.kids_record_game_result_internal(uuid, text, text, integer, integer, integer, text, smallint, integer, boolean, jsonb)
  from public, anon, authenticated;
grant execute on function public.kids_record_game_result_internal(uuid, text, text, integer, integer, integer, text, smallint, integer, boolean, jsonb)
  to service_role;

-- The old function is retained for migration-history compatibility but is no
-- longer callable by application roles.
revoke all on function public.kids_record_game_result(text, text, integer, integer, integer, text, smallint, smallint, integer, boolean, jsonb)
  from public, anon, authenticated;
