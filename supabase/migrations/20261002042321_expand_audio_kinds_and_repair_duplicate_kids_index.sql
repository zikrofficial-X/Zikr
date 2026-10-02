-- Remote migration: 20261002042321
alter table public.site_audio_assets
  drop constraint if exists site_audio_assets_kind_check;

alter table public.site_audio_assets
  add constraint site_audio_assets_kind_check
  check (kind in ('adhan', 'salawat', 'dhikr'));

drop index if exists public.kids_game_progress_user_game_unique;
