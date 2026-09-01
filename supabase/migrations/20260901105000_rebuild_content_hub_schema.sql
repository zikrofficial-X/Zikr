-- ZIKR Content Hub / Kids Games schema
create extension if not exists pg_trgm;

create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(), name_ar text not null, name_en text,
  source_type text not null default 'reference', url text, license text, attribution text,
  authority_level smallint not null default 3 check (authority_level between 1 and 5), notes text,
  verified boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.content_library (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('article','lesson','story','biography','fiqh','aqeedah','hadith_study','tafsir_study','history','family','kids','research','file','collection')),
  title_ar text not null, title_en text, slug text not null unique, summary_ar text, body_ar text, body_en text,
  category text not null, tags text[] not null default '{}', source_id uuid references public.content_sources(id) on delete set null,
  author_name text, reviewer_name text,
  review_status text not null default 'draft' check (review_status in ('draft','editorial_review','scholarly_review','approved','rejected')),
  published boolean not null default false, featured boolean not null default false, age_group text, cover_url text,
  media jsonb not null default '{}', seo jsonb not null default '{}', metadata jsonb not null default '{}', views bigint not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz,
  searchable tsvector generated always as (to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(summary_ar,'') || ' ' || coalesce(body_ar,'') || ' ' || coalesce(category,'') || ' ' || array_to_string(tags,' '))) stored
);

-- Compatibility: content_library may already exist from an older schema migration.
-- In that case CREATE TABLE IF NOT EXISTS does not add the generated search column.
alter table if exists public.content_library
  add column if not exists searchable tsvector generated always as (
    to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(summary_ar,'') || ' ' ||
      coalesce(body_ar,'') || ' ' || coalesce(category,'') || ' ' || array_to_string(tags,' '))
  ) stored;

create index if not exists content_library_search_idx on public.content_library using gin(searchable);
create index if not exists content_library_kind_idx on public.content_library(kind);
create index if not exists content_library_category_idx on public.content_library(category);
create index if not exists content_library_status_idx on public.content_library(review_status,published);
create index if not exists content_library_tags_idx on public.content_library using gin(tags);
create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(), content_id uuid not null references public.content_library(id) on delete cascade,
  revision_no integer not null, snapshot jsonb not null, change_note text, changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), unique(content_id,revision_no)
);
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(), title text not null,
  asset_type text not null check (asset_type in ('image','audio','video','pdf','epub','document','game_asset')),
  url text not null, storage_path text, mime_type text, size_bytes bigint, width integer, height integer, duration_seconds integer,
  alt_text_ar text, license text, attribution text, verified_rights boolean not null default false,
  metadata jsonb not null default '{}', published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.kids_games (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title_ar text not null, title_en text,
  short_description_ar text, description_ar text, genre text not null default 'educational', age_min smallint not null default 6, age_max smallint not null default 12,
  difficulty text not null default 'easy', learning_objectives text[] not null default '{}', engine text not null default 'web', cover_url text, icon_url text,
  config jsonb not null default '{}', published boolean not null default false, featured boolean not null default false, order_index integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.kids_game_levels (
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.kids_games(id) on delete cascade, level_no integer not null,
  title_ar text not null, description_ar text, objective_ar text, mechanic text not null, difficulty text not null default 'easy', reward_xp integer not null default 10,
  reward_badge text, config jsonb not null default '{}', published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(game_id,level_no)
);
create table if not exists public.kids_game_questions (
  id uuid primary key default gen_random_uuid(), level_id uuid not null references public.kids_game_levels(id) on delete cascade, prompt_ar text not null,
  options jsonb not null default '[]', correct_index integer not null default 0, explanation_ar text, source_id uuid references public.content_sources(id) on delete set null,
  order_index integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.kids_game_progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.kids_games(id) on delete cascade, level_no integer not null default 1, xp integer not null default 0,
  best_score integer not null default 0, badges text[] not null default '{}', last_played_at timestamptz not null default now(), unique(user_id,game_id)
);
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(), admin_id uuid references auth.users(id) on delete set null, action text not null,
  entity_type text not null, entity_id text, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.admin_settings (
  key text primary key, value jsonb not null default '{}', description text, updated_by uuid references auth.users(id) on delete set null, updated_at timestamptz not null default now()
);

alter table public.content_sources enable row level security; alter table public.content_library enable row level security; alter table public.content_revisions enable row level security;
alter table public.media_assets enable row level security; alter table public.kids_games enable row level security; alter table public.kids_game_levels enable row level security;
alter table public.kids_game_questions enable row level security; alter table public.kids_game_progress enable row level security; alter table public.admin_audit_log enable row level security; alter table public.admin_settings enable row level security;

-- Idempotent compatibility policies required by later security hardening.
drop policy if exists content_library_admin_all on public.content_library;
drop policy if exists content_library_public_read on public.content_library;
drop policy if exists content_sources_admin_all on public.content_sources;
drop policy if exists content_sources_public_read on public.content_sources;
drop policy if exists media_assets_admin_all on public.media_assets;
drop policy if exists media_assets_public_read on public.media_assets;
drop policy if exists kids_games_admin_all on public.kids_games;
drop policy if exists kids_games_public_read on public.kids_games;
drop policy if exists kids_game_levels_admin_all on public.kids_game_levels;
drop policy if exists kids_game_levels_public_read on public.kids_game_levels;
drop policy if exists kids_game_questions_admin_all on public.kids_game_questions;
drop policy if exists kids_game_questions_public_read on public.kids_game_questions;
create policy content_library_admin_all on public.content_library for all to authenticated using (is_admin_user()) with check (is_admin_user());
create policy content_library_public_read on public.content_library for select to anon,authenticated using (published=true and review_status='approved');
create policy content_sources_admin_all on public.content_sources for all to authenticated using (is_admin_user()) with check (is_admin_user());
create policy content_sources_public_read on public.content_sources for select to anon,authenticated using (verified=true);
create policy media_assets_admin_all on public.media_assets for all to authenticated using (is_admin_user()) with check (is_admin_user());
create policy media_assets_public_read on public.media_assets for select to anon,authenticated using (published=true and verified_rights=true);
create policy kids_games_admin_all on public.kids_games for all to authenticated using (is_admin_user()) with check (is_admin_user());
create policy kids_games_public_read on public.kids_games for select to anon,authenticated using (published=true);
create policy kids_game_levels_admin_all on public.kids_game_levels for all to authenticated using (is_admin_user()) with check (is_admin_user());
create policy kids_game_levels_public_read on public.kids_game_levels for select to anon,authenticated using (published=true);
create policy kids_game_questions_admin_all on public.kids_game_questions for all to authenticated using (is_admin_user()) with check (is_admin_user());
create policy kids_game_questions_public_read on public.kids_game_questions for select to anon,authenticated using (published=true and exists(select 1 from public.kids_game_levels l where l.id=level_id and l.published=true));
create policy kids_game_progress_owner on public.kids_game_progress for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy admin_audit_log_admin_all on public.admin_audit_log for all to authenticated using (is_admin_user()) with check (is_admin_user());
create policy admin_settings_admin_all on public.admin_settings for all to authenticated using (is_admin_user()) with check (is_admin_user());

create or replace function public.enforce_content_publish_gate() returns trigger language plpgsql security definer set search_path=public as $$
begin if new.published then if new.review_status<>'approved' then raise exception 'CONTENT_PUBLISH_REQUIRES_APPROVAL'; end if; if new.source_id is null then raise exception 'CONTENT_PUBLISH_REQUIRES_SOURCE'; end if; if not exists(select 1 from public.content_sources s where s.id=new.source_id and s.verified) then raise exception 'CONTENT_PUBLISH_REQUIRES_VERIFIED_SOURCE'; end if; new.published_at:=coalesce(new.published_at,now()); else new.published_at:=null; end if; return new; end $$;
drop trigger if exists content_publish_gate on public.content_library; create trigger content_publish_gate before insert or update on public.content_library for each row execute function public.enforce_content_publish_gate();
create or replace function public.enforce_media_publish_gate() returns trigger language plpgsql security definer set search_path=public as $$
begin if new.published and not new.verified_rights then raise exception 'MEDIA_PUBLISH_REQUIRES_VERIFIED_RIGHTS'; end if; return new; end $$;
drop trigger if exists media_publish_gate on public.media_assets; create trigger media_publish_gate before insert or update on public.media_assets for each row execute function public.enforce_media_publish_gate();
create or replace function public.validate_game_question() returns trigger language plpgsql security definer set search_path=public as $$
declare option_count integer; begin option_count:=jsonb_array_length(coalesce(new.options,'[]'::jsonb)); if option_count<2 then raise exception 'GAME_QUESTION_REQUIRES_AT_LEAST_TWO_OPTIONS'; end if; if new.correct_index<0 or new.correct_index>=option_count then raise exception 'GAME_QUESTION_CORRECT_INDEX_OUT_OF_RANGE'; end if; return new; end $$;
drop trigger if exists game_question_validation on public.kids_game_questions; create trigger game_question_validation before insert or update on public.kids_game_questions for each row execute function public.validate_game_question();
create or replace function public.enforce_game_publish_gate() returns trigger language plpgsql security definer set search_path=public as $$
begin if new.published and not exists(select 1 from public.kids_game_levels l where l.game_id=new.id and l.published) then raise exception 'GAME_PUBLISH_REQUIRES_PUBLISHED_LEVEL'; end if; return new; end $$;
drop trigger if exists game_publish_gate on public.kids_games; create trigger game_publish_gate before insert or update on public.kids_games for each row execute function public.enforce_game_publish_gate();
create or replace function public.enforce_level_publish_gate() returns trigger language plpgsql security definer set search_path=public as $$
begin if new.published and not exists(select 1 from public.kids_games g where g.id=new.game_id) then raise exception 'GAME_LEVEL_REQUIRES_GAME'; end if; return new; end $$;
drop trigger if exists game_level_publish_gate on public.kids_game_levels; create trigger game_level_publish_gate before insert or update on public.kids_game_levels for each row execute function public.enforce_level_publish_gate();
create or replace function public.admin_control_center_snapshot() returns jsonb language plpgsql security definer set search_path=public as $$
begin return jsonb_build_object('generated_at',now(),'counts',jsonb_build_object('users',(select count(*) from public.profiles),'content',(select count(*) from public.content_library),'published_content',(select count(*) from public.content_library where published and review_status='approved'),'pending_review',(select count(*) from public.content_library where review_status in ('editorial_review','scholarly_review')),'sources',(select count(*) from public.content_sources),'media',(select count(*) from public.media_assets),'games',(select count(*) from public.kids_games),'levels',(select count(*) from public.kids_game_levels),'questions',(select count(*) from public.kids_game_questions))); end $$;
revoke all on function public.admin_control_center_snapshot() from public; grant execute on function public.admin_control_center_snapshot() to service_role;
