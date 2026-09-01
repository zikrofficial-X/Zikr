-- Revoke direct RPC execution for publication guard trigger functions.
-- Triggers can still invoke these functions internally; anon/authenticated clients cannot call them through PostgREST.
revoke execute on function public.guard_content_publication() from anon, authenticated;
revoke execute on function public.guard_game_publication() from anon, authenticated;
revoke execute on function public.guard_media_publication() from anon, authenticated;

-- Restrict admin policies to signed-in users and make public read policies explicit.
alter policy content_library_admin_all on public.content_library to authenticated;
alter policy content_library_public_read on public.content_library to anon, authenticated;
alter policy content_sources_admin_all on public.content_sources to authenticated;
alter policy content_sources_public_read on public.content_sources to anon, authenticated;
alter policy media_assets_admin_all on public.media_assets to authenticated;
alter policy media_assets_public_read on public.media_assets to anon, authenticated;
alter policy kids_games_admin_all on public.kids_games to authenticated;
alter policy kids_games_public_read on public.kids_games to anon, authenticated;
alter policy kids_game_levels_admin_all on public.kids_game_levels to authenticated;
alter policy kids_game_levels_public_read on public.kids_game_levels to anon, authenticated;
alter policy kids_game_questions_admin_all on public.kids_game_questions to authenticated;
alter policy kids_game_questions_public_read on public.kids_game_questions to anon, authenticated;

-- Avoid per-row auth re-evaluation in the audit RLS policy.
alter policy admin_actions_audit_admin_select on public.admin_actions_audit
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'::role
  ));

-- Cover foreign keys for common admin/content relationships.
create index if not exists admin_audit_log_user_id_idx on public.admin_audit_log (user_id);
create index if not exists admin_settings_updated_by_idx on public.admin_settings (updated_by);
create index if not exists content_library_source_id_idx on public.content_library (source_id);
create index if not exists content_revisions_changed_by_idx on public.content_revisions (changed_by);
create index if not exists kids_game_questions_source_id_idx on public.kids_game_questions (source_id);
create index if not exists media_assets_created_by_idx on public.media_assets (created_by);
create index if not exists media_assets_source_id_idx on public.media_assets (source_id);
