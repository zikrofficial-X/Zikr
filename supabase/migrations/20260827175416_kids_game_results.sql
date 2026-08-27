-- Private Kids game results. Scores are telemetry/progress, not authoritative
-- monetary rewards; XP is bounded and calculated by the server endpoint.
create table if not exists public.kids_game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null,
  client_submission_id text not null,
  score integer not null default 0,
  collectibles integer not null default 0,
  distance integer not null default 0,
  xp_awarded smallint not null default 0,
  difficulty text not null default 'easy',
  played_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kids_game_results_score_check check (score between 0 and 100000),
  constraint kids_game_results_collectibles_check check (collectibles between 0 and 10000),
  constraint kids_game_results_distance_check check (distance between 0 and 1000000),
  constraint kids_game_results_xp_check check (xp_awarded between 0 and 100),
  constraint kids_game_results_difficulty_check check (difficulty in ('easy', 'normal', 'hard')),
  constraint kids_game_results_client_submission_id_check check (char_length(client_submission_id) between 8 and 100)
);

create unique index if not exists kids_game_results_user_client_unique
  on public.kids_game_results (user_id, client_submission_id);
create index if not exists kids_game_results_user_game_idx
  on public.kids_game_results (user_id, game_id);
create index if not exists kids_game_results_game_score_idx
  on public.kids_game_results (game_id, score desc);
create index if not exists kids_game_results_game_played_at_idx
  on public.kids_game_results (game_id, played_at desc);

alter table public.kids_game_results enable row level security;

drop policy if exists "kids_game_results_select_own" on public.kids_game_results;
create policy "kids_game_results_select_own"
  on public.kids_game_results
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "kids_game_results_insert_own" on public.kids_game_results;
create policy "kids_game_results_insert_own"
  on public.kids_game_results
  for insert
  to authenticated
  with check (auth.uid() = user_id);

revoke all on table public.kids_game_results from anon;
grant select, insert on table public.kids_game_results to authenticated;

-- Publish the first registered game without overwriting an administrator's existing row.
insert into public.kids_content (
  title_ar,
  title_en,
  slug,
  type,
  content_ar,
  content_en,
  age_group,
  published,
  is_active,
  metadata
)
values (
  'ذِكر رانر',
  'ZIKR Runner',
  'zikr-runner',
  'game',
  'اجمع النجوم وتجاوز العوائق في رحلة جري آمنة ولطيفة. استخدم اللعبة للتعلم والمرح، وخذ استراحة متى شئت.',
  'Collect stars and avoid obstacles in a gentle, safe running journey.',
  '6-8',
  true,
  true,
  jsonb_build_object(
    'category', 'ألعاب الحركة الآمنة',
    'gameId', 'zikr-runner',
    'version', 1,
    'difficulty', 'easy',
    'value', 'التركيز والمثابرة',
    'reward', 'نجوم التعلم'
  )
)
on conflict (slug) do nothing;
