-- Revoke direct RPC execution for publication guard trigger functions when they exist.
DO $$
BEGIN
  IF to_regprocedure('public.guard_content_publication()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.guard_content_publication() FROM anon, authenticated;
  END IF;
  IF to_regprocedure('public.guard_game_publication()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.guard_game_publication() FROM anon, authenticated;
  END IF;
  IF to_regprocedure('public.guard_media_publication()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.guard_media_publication() FROM anon, authenticated;
  END IF;
END $$;

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

-- Cover actual foreign-key relationships present in the content hub schema.
create index if not exists admin_audit_log_admin_id_idx on public.admin_audit_log (admin_id);
create index if not exists admin_settings_updated_by_idx on public.admin_settings (updated_by);
create index if not exists content_library_source_id_idx on public.content_library (source_id);
create index if not exists content_revisions_changed_by_idx on public.content_revisions (changed_by);
create index if not exists kids_game_questions_source_id_idx on public.kids_game_questions (source_id);
create index if not exists media_assets_source_id_idx on public.media_assets (source_id);
