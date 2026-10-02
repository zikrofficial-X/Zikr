create index if not exists hadith_explanations_hadith_id_idx
  on public.hadith_explanations (hadith_id);

create index if not exists recent_recitations_user_id_idx
  on public.recent_recitations (user_id);

create index if not exists recent_recitations_reciter_id_idx
  on public.recent_recitations (reciter_id);

create index if not exists reciter_favorites_reciter_id_idx
  on public.reciter_favorites (reciter_id);

create index if not exists tawasheeh_favorites_tawasheeh_id_idx
  on public.tawasheeh_favorites (tawasheeh_id);

create index if not exists tawasheeh_playlist_items_tawasheeh_id_idx
  on public.tawasheeh_playlist_items (tawasheeh_id);

create index if not exists tawasheeh_playlists_user_id_idx
  on public.tawasheeh_playlists (user_id);
