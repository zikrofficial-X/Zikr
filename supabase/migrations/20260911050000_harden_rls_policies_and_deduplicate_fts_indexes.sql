-- Post-audit hardening for production Supabase RLS/performance findings.
-- This migration is intentionally idempotent for safe preview replay.

-- contacts: retain the intentional public contact-form INSERT policy and remove
-- the redundant authenticated/owner insert policy.
DROP POLICY IF EXISTS contacts_insert ON public.contacts;

-- memorization_progress: replace duplicated broad/action-specific policies with
-- one owner policy per operation. `(select auth.uid())` is evaluated once per query.
DROP POLICY IF EXISTS memorization_progress_owner ON public.memorization_progress;
DROP POLICY IF EXISTS memorization_progress_owner_read ON public.memorization_progress;
DROP POLICY IF EXISTS memorization_progress_owner_insert ON public.memorization_progress;
DROP POLICY IF EXISTS memorization_progress_owner_update ON public.memorization_progress;
DROP POLICY IF EXISTS memorization_progress_owner_delete ON public.memorization_progress;

CREATE POLICY memorization_progress_owner_read
  ON public.memorization_progress
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY memorization_progress_owner_insert
  ON public.memorization_progress
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY memorization_progress_owner_update
  ON public.memorization_progress
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY memorization_progress_owner_delete
  ON public.memorization_progress
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- notifications: remove duplicated broad policy and keep initplan-safe owner policies.
DROP POLICY IF EXISTS notifications_owner ON public.notifications;
DROP POLICY IF EXISTS notifications_owner_read ON public.notifications;
DROP POLICY IF EXISTS notifications_owner_update ON public.notifications;

CREATE POLICY notifications_owner_read
  ON public.notifications
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY notifications_owner_update
  ON public.notifications
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Remove duplicate GIN indexes. The canonical *_search_idx indexes remain.
DROP INDEX IF EXISTS public.duas_searchable_idx;
DROP INDEX IF EXISTS public.hadiths_searchable_idx;
DROP INDEX IF EXISTS public.quran_ayahs_searchable_idx;
