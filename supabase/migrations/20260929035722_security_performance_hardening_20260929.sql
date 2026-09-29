-- ZIKR Supabase security/performance hardening.
-- Mirrors the migration applied to the canonical Supabase project.
-- Idempotent where practical.

drop index if exists public.idx_companion_stories_companion;
drop index if exists public.idx_hadiths_book;
drop index if exists public.idx_hadiths_published;
drop index if exists public.prophet_sections_prophet_idx;
drop index if exists public.scholars_published_idx;
drop index if exists public.stories_published_idx;
drop index if exists public.tawasheeh_playlists_user_idx;

create index if not exists admin_audit_log_user_id_idx on public.admin_audit_log (user_id);
create index if not exists articles_category_id_idx on public.articles (category_id);
create index if not exists kids_game_questions_level_id_idx on public.kids_game_questions (level_id);
create index if not exists site_audio_assets_created_by_idx on public.site_audio_assets (created_by);
create index if not exists videos_category_id_idx on public.videos (category_id);

revoke execute on function public.handle_new_user() from anon, authenticated;
alter function public.update_updated_at_column() set search_path = pg_catalog;

drop policy if exists delete_videos on public.videos;
drop policy if exists insert_videos on public.videos;
drop policy if exists update_videos on public.videos;
drop policy if exists select_videos on public.videos;
drop policy if exists select_videos_anon on public.videos;
drop policy if exists video_categories_public_read on public.video_categories;
drop policy if exists delete_video_categories on public.video_categories;
drop policy if exists insert_video_categories on public.video_categories;
drop policy if exists select_video_categories on public.video_categories;
drop policy if exists select_video_categories_anon on public.video_categories;

-- videos_public_read is created by the canonical 202507/202607 RLS migration chain.
-- Reconcile it explicitly here so this migration is safe on both a replayed preview DB
-- and the current production schema. PostgreSQL does not support CREATE POLICY IF NOT EXISTS.
drop policy if exists videos_public_read on public.videos;
create policy videos_public_read on public.videos for select to public using (published = true);

create policy video_categories_public_read on public.video_categories for select to public using (published = true);

drop policy if exists allow_user_delete_favorites on public.tawasheeh_favorites;
drop policy if exists allow_user_insert_favorites on public.tawasheeh_favorites;
drop policy if exists allow_user_manage_favorites on public.tawasheeh_favorites;
drop policy if exists tawasheeh_favorites_owner_all on public.tawasheeh_favorites;
create policy tawasheeh_favorites_owner_all on public.tawasheeh_favorites for all to public
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists allow_user_insert_playlists on public.tawasheeh_playlists;
drop policy if exists allow_user_read_own_playlists on public.tawasheeh_playlists;
drop policy if exists allow_user_update_playlists on public.tawasheeh_playlists;
drop policy if exists tawasheeh_playlists_owner_delete on public.tawasheeh_playlists;
drop policy if exists tawasheeh_playlists_owner_insert on public.tawasheeh_playlists;
drop policy if exists tawasheeh_playlists_owner_update on public.tawasheeh_playlists;
drop policy if exists tawasheeh_playlists_public_or_owner_select on public.tawasheeh_playlists;
create policy tawasheeh_playlists_owner_all on public.tawasheeh_playlists for all to public
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy tawasheeh_playlists_public_or_owner_select on public.tawasheeh_playlists for select to public
  using ((is_public = true) or ((select auth.uid()) = user_id));

do $$
declare p record; new_qual text; new_check text;
begin
  for p in select schemaname, tablename, policyname, qual, with_check from pg_policies where schemaname='public' and (coalesce(qual,'') like '%auth.uid()%' or coalesce(with_check,'') like '%auth.uid()%') loop
    new_qual := replace(p.qual, 'auth.uid()', '(select auth.uid())');
    new_check := replace(p.with_check, 'auth.uid()', '(select auth.uid())');
    if new_qual is not null and new_qual <> p.qual then
      execute format('alter policy %I on %I.%I using (%s)', p.policyname, p.schemaname, p.tablename, new_qual);
    end if;
    if new_check is not null and new_check <> p.with_check then
      execute format('alter policy %I on %I.%I with check (%s)', p.policyname, p.schemaname, p.tablename, new_check);
    end if;
  end loop;
end $$;
