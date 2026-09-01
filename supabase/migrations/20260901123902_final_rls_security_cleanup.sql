-- Final content-hub RLS cleanup.
DO $$
DECLARE t text; p text;
BEGIN
  FOREACH t IN ARRAY ARRAY['content_library','content_sources','media_assets','kids_games','kids_game_levels','kids_game_questions'] LOOP
    FOREACH p IN ARRAY ARRAY[t||'_admin_all', t||'_admin_select', t||'_admin_insert', t||'_admin_update', t||'_admin_delete', t||'_public_read'] LOOP
      IF to_regclass('public.'||t) IS NOT NULL THEN
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
      END IF;
    END LOOP;
  END LOOP;
END $$;

CREATE POLICY content_library_public_read ON public.content_library FOR SELECT TO anon USING (published=true AND review_status='approved');
CREATE POLICY content_library_admin_all ON public.content_library FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY content_sources_public_read ON public.content_sources FOR SELECT TO anon USING (verified=true);
CREATE POLICY content_sources_admin_all ON public.content_sources FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY media_assets_public_read ON public.media_assets FOR SELECT TO anon USING (published=true AND COALESCE(verified_rights,rights_verified,false));
CREATE POLICY media_assets_admin_all ON public.media_assets FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY kids_games_public_read ON public.kids_games FOR SELECT TO anon USING (published=true);
CREATE POLICY kids_games_admin_all ON public.kids_games FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY kids_game_levels_public_read ON public.kids_game_levels FOR SELECT TO anon USING (published=true);
CREATE POLICY kids_game_levels_admin_all ON public.kids_game_levels FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY kids_game_questions_public_read ON public.kids_game_questions FOR SELECT TO anon USING (published=true);
CREATE POLICY kids_game_questions_admin_all ON public.kids_game_questions FOR ALL TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS kids_game_progress_owner ON public.kids_game_progress;
DROP POLICY IF EXISTS kids_game_progress_select_own ON public.kids_game_progress;
CREATE POLICY kids_game_progress_owner ON public.kids_game_progress FOR ALL TO authenticated USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id);

DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY['enforce_content_publish_gate','enforce_game_publish_gate','enforce_level_publish_gate','enforce_media_publish_gate','refresh_content_library_searchable','sync_media_asset_compat_columns','validate_game_question'] LOOP
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname=fn) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I() FROM PUBLIC, anon, authenticated', fn);
    END IF;
  END LOOP;
END $$;
