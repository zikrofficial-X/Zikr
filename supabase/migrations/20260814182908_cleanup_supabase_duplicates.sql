-- Zikr Supabase cleanup: remove duplicate indexes and legacy overlapping admin policies.
-- This migration intentionally keeps one canonical index from each identical pair.
-- It does not change public-read or owner RLS semantics.


-- Remove redundant duplicate indexes while retaining the canonical/constraint-backed index.
DROP INDEX IF EXISTS public.idx_articles_category;
DROP INDEX IF EXISTS public.idx_articles_slug;
DROP INDEX IF EXISTS public.articles_searchable_idx;
DROP INDEX IF EXISTS public.idx_battles_published;
DROP INDEX IF EXISTS public.idx_companions_published;
DROP INDEX IF EXISTS public.idx_conquests_published;
DROP INDEX IF EXISTS public.kids_content_slug_unique_idx;
DROP INDEX IF EXISTS public.prayer_locations_rls_user_id_idx;
DROP INDEX IF EXISTS public.prayer_notifications_rls_user_id_idx;
DROP INDEX IF EXISTS public.prayer_preferences_rls_user_id_idx;
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_quran_ayahs_surah;
DROP INDEX IF EXISTS public.quran_reciters_code_unique;
DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_email_unique;
  END IF;
END $$;
DROP INDEX IF EXISTS public.tawasheeh_category_id_idx;
DROP INDEX IF EXISTS public.tawasheeh_published_idx;
DROP INDEX IF EXISTS public.videos_category_idx;

-- These legacy policies overlap the canonical private.is_admin_user() policies.
-- Removing them reduces duplicate permissive evaluation without changing access.
DROP POLICY IF EXISTS "Admins can manage competitions" ON public.competitions;
DROP POLICY IF EXISTS "Admins can manage memorization plans" ON public.memorization_plans;
DROP POLICY IF EXISTS "Allow service role to update social stats" ON public.kids_content;
