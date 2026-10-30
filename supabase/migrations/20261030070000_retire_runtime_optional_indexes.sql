-- Phase 19: retire non-unique indexes owned only by runtime-retired,
-- empty tables. The tables and their generated types remain in place for
-- historical/schema compatibility; no table or data is dropped here.

drop index if exists public.hadith_explanations_hadith_id_idx;
drop index if exists public.recent_recitations_user_id_idx;
drop index if exists public.recent_recitations_reciter_id_idx;
drop index if exists public.reciter_favorites_reciter_id_idx;
drop index if exists public.tawasheeh_favorites_tawasheeh_id_idx;
drop index if exists public.tawasheeh_playlist_items_tawasheeh_id_idx;
drop index if exists public.tawasheeh_playlists_user_id_idx;
drop index if exists public.idx_video_generation_requests_processing_heygen;

comment on table public.hadith_explanations is
  'Runtime-retired and empty as of 2026-10-30; retained pending a separately approved table-retirement migration.';
comment on table public.recent_recitations is
  'Runtime-retired and empty as of 2026-10-30; retained pending a separately approved table-retirement migration.';
comment on table public.reciter_favorites is
  'Runtime-retired and empty as of 2026-10-30; retained pending a separately approved table-retirement migration.';
comment on table public.tawasheeh_favorites is
  'Runtime-retired and empty as of 2026-10-30; retained pending a separately approved table-retirement migration.';
comment on table public.tawasheeh_playlists is
  'Runtime-retired and empty as of 2026-10-30; retained pending a separately approved table-retirement migration.';
comment on table public.tawasheeh_playlist_items is
  'Runtime-retired and empty as of 2026-10-30; retained pending a separately approved table-retirement migration.';
