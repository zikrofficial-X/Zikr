-- Replace overlapping PUBLIC/ALL SELECT policies with role-specific SELECT policies.
-- This migration is defensive for legacy schemas: required policy columns are
-- added before policy creation so PostgreSQL can parse every USING expression.
-- Anonymous users see only publishable content. Signed-in users see publishable
-- content, while admins additionally see drafts/private records. Mutations remain
-- admin-only.

-- Schema compatibility required by the policies below.
ALTER TABLE IF EXISTS public.content_library
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.content_library
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'draft';

ALTER TABLE IF EXISTS public.media_assets
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.media_assets
  ADD COLUMN IF NOT EXISTS rights_verified boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.media_assets
  ADD COLUMN IF NOT EXISTS verified_rights boolean NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.kids_games
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.kids_game_levels
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.kids_game_questions
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

-- content_library
DROP POLICY IF EXISTS content_library_admin_all ON public.content_library;
DROP POLICY IF EXISTS content_library_public_read ON public.content_library;
DROP POLICY IF EXISTS content_library_admin_select ON public.content_library;
DROP POLICY IF EXISTS content_library_admin_insert ON public.content_library;
DROP POLICY IF EXISTS content_library_admin_update ON public.content_library;
DROP POLICY IF EXISTS content_library_admin_delete ON public.content_library;
CREATE POLICY content_library_public_read ON public.content_library
  FOR SELECT TO anon
  USING (published = true AND review_status = 'approved');
CREATE POLICY content_library_admin_select ON public.content_library
  FOR SELECT TO authenticated
  USING ((published = true AND review_status = 'approved') OR is_admin_user());
CREATE POLICY content_library_admin_insert ON public.content_library
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user());
CREATE POLICY content_library_admin_update ON public.content_library
  FOR UPDATE TO authenticated
  USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY content_library_admin_delete ON public.content_library
  FOR DELETE TO authenticated
  USING (is_admin_user());

-- content_sources
DROP POLICY IF EXISTS content_sources_admin_all ON public.content_sources;
DROP POLICY IF EXISTS content_sources_public_read ON public.content_sources;
DROP POLICY IF EXISTS content_sources_admin_select ON public.content_sources;
DROP POLICY IF EXISTS content_sources_admin_insert ON public.content_sources;
DROP POLICY IF EXISTS content_sources_admin_update ON public.content_sources;
DROP POLICY IF EXISTS content_sources_admin_delete ON public.content_sources;
CREATE POLICY content_sources_public_read ON public.content_sources
  FOR SELECT TO anon
  USING (verified = true);
CREATE POLICY content_sources_admin_select ON public.content_sources
  FOR SELECT TO authenticated
  USING (verified = true OR is_admin_user());
CREATE POLICY content_sources_admin_insert ON public.content_sources
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user());
CREATE POLICY content_sources_admin_update ON public.content_sources
  FOR UPDATE TO authenticated
  USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY content_sources_admin_delete ON public.content_sources
  FOR DELETE TO authenticated
  USING (is_admin_user());

-- media_assets
DROP POLICY IF EXISTS media_assets_admin_all ON public.media_assets;
DROP POLICY IF EXISTS media_assets_public_read ON public.media_assets;
DROP POLICY IF EXISTS media_assets_admin_select ON public.media_assets;
DROP POLICY IF EXISTS media_assets_admin_insert ON public.media_assets;
DROP POLICY IF EXISTS media_assets_admin_update ON public.media_assets;
DROP POLICY IF EXISTS media_assets_admin_delete ON public.media_assets;
CREATE POLICY media_assets_public_read ON public.media_assets
  FOR SELECT TO anon
  USING (published = true AND COALESCE(verified_rights, rights_verified, false) = true);
CREATE POLICY media_assets_admin_select ON public.media_assets
  FOR SELECT TO authenticated
  USING ((published = true AND COALESCE(verified_rights, rights_verified, false) = true) OR is_admin_user());
CREATE POLICY media_assets_admin_insert ON public.media_assets
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user());
CREATE POLICY media_assets_admin_update ON public.media_assets
  FOR UPDATE TO authenticated
  USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY media_assets_admin_delete ON public.media_assets
  FOR DELETE TO authenticated
  USING (is_admin_user());

-- kids_games
DROP POLICY IF EXISTS kids_games_admin_all ON public.kids_games;
DROP POLICY IF EXISTS kids_games_public_read ON public.kids_games;
DROP POLICY IF EXISTS kids_games_admin_select ON public.kids_games;
DROP POLICY IF EXISTS kids_games_admin_insert ON public.kids_games;
DROP POLICY IF EXISTS kids_games_admin_update ON public.kids_games;
DROP POLICY IF EXISTS kids_games_admin_delete ON public.kids_games;
CREATE POLICY kids_games_public_read ON public.kids_games
  FOR SELECT TO anon
  USING (published = true);
CREATE POLICY kids_games_admin_select ON public.kids_games
  FOR SELECT TO authenticated
  USING (published = true OR is_admin_user());
CREATE POLICY kids_games_admin_insert ON public.kids_games
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user());
CREATE POLICY kids_games_admin_update ON public.kids_games
  FOR UPDATE TO authenticated
  USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY kids_games_admin_delete ON public.kids_games
  FOR DELETE TO authenticated
  USING (is_admin_user());

-- kids_game_levels
DROP POLICY IF EXISTS kids_game_levels_admin_all ON public.kids_game_levels;
DROP POLICY IF EXISTS kids_game_levels_public_read ON public.kids_game_levels;
DROP POLICY IF EXISTS kids_game_levels_admin_select ON public.kids_game_levels;
DROP POLICY IF EXISTS kids_game_levels_admin_insert ON public.kids_game_levels;
DROP POLICY IF EXISTS kids_game_levels_admin_update ON public.kids_game_levels;
DROP POLICY IF EXISTS kids_game_levels_admin_delete ON public.kids_game_levels;
CREATE POLICY kids_game_levels_public_read ON public.kids_game_levels
  FOR SELECT TO anon
  USING (published = true);
CREATE POLICY kids_game_levels_admin_select ON public.kids_game_levels
  FOR SELECT TO authenticated
  USING (published = true OR is_admin_user());
CREATE POLICY kids_game_levels_admin_insert ON public.kids_game_levels
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user());
CREATE POLICY kids_game_levels_admin_update ON public.kids_game_levels
  FOR UPDATE TO authenticated
  USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY kids_game_levels_admin_delete ON public.kids_game_levels
  FOR DELETE TO authenticated
  USING (is_admin_user());

-- kids_game_questions
DROP POLICY IF EXISTS kids_game_questions_admin_all ON public.kids_game_questions;
DROP POLICY IF EXISTS kids_game_questions_public_read ON public.kids_game_questions;
DROP POLICY IF EXISTS kids_game_questions_admin_select ON public.kids_game_questions;
DROP POLICY IF EXISTS kids_game_questions_admin_insert ON public.kids_game_questions;
DROP POLICY IF EXISTS kids_game_questions_admin_update ON public.kids_game_questions;
DROP POLICY IF EXISTS kids_game_questions_admin_delete ON public.kids_game_questions;
CREATE POLICY kids_game_questions_public_read ON public.kids_game_questions
  FOR SELECT TO anon
  USING (published = true);
CREATE POLICY kids_game_questions_admin_select ON public.kids_game_questions
  FOR SELECT TO authenticated
  USING (published = true OR is_admin_user());
CREATE POLICY kids_game_questions_admin_insert ON public.kids_game_questions
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user());
CREATE POLICY kids_game_questions_admin_update ON public.kids_game_questions
  FOR UPDATE TO authenticated
  USING (is_admin_user()) WITH CHECK (is_admin_user());
CREATE POLICY kids_game_questions_admin_delete ON public.kids_game_questions
  FOR DELETE TO authenticated
  USING (is_admin_user());
