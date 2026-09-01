-- Production-safe security/performance hardening.
-- This migration is intentionally defensive because the content-hub bootstrap
-- supports both fresh and legacy installations.

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

-- Alter policies only when the policy/table actually exists.
DO $$
DECLARE
  r record;
  policy_exists boolean;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('public.content_library','content_library_admin_all','authenticated'),
      ('public.content_library','content_library_public_read','anon, authenticated'),
      ('public.content_sources','content_sources_admin_all','authenticated'),
      ('public.content_sources','content_sources_public_read','anon, authenticated'),
      ('public.media_assets','media_assets_admin_all','authenticated'),
      ('public.media_assets','media_assets_public_read','anon, authenticated'),
      ('public.kids_games','kids_games_admin_all','authenticated'),
      ('public.kids_games','kids_games_public_read','anon, authenticated'),
      ('public.kids_game_levels','kids_game_levels_admin_all','authenticated'),
      ('public.kids_game_levels','kids_game_levels_public_read','anon, authenticated'),
      ('public.kids_game_questions','kids_game_questions_admin_all','authenticated'),
      ('public.kids_game_questions','kids_game_questions_public_read','anon, authenticated')
    ) AS x(table_name, policy_name, roles)
  LOOP
    IF to_regclass(r.table_name) IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = split_part(r.table_name,'.',1)
          AND tablename = split_part(r.table_name,'.',2)
          AND policyname = r.policy_name
      ) INTO policy_exists;

      IF policy_exists THEN
        EXECUTE format('ALTER POLICY %I ON %s TO %s',
          r.policy_name,
          r.table_name,
          r.roles
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- Avoid per-row auth re-evaluation in the audit RLS policy when the policy exists.
DO $$
BEGIN
  IF to_regclass('public.admin_actions_audit') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname='public' AND tablename='admin_actions_audit'
         AND policyname='admin_actions_audit_admin_select'
     ) THEN
    EXECUTE $sql$
      ALTER POLICY admin_actions_audit_admin_select ON public.admin_actions_audit
      USING (exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'admin'::role
      ))
    $sql$;
  END IF;
END $$;

-- Add only those indexes whose target table/column exists.
DO $$
BEGIN
  IF to_regclass('public.admin_audit_log') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='admin_id') THEN
    CREATE INDEX IF NOT EXISTS admin_audit_log_admin_id_idx ON public.admin_audit_log (admin_id);
  END IF;

  IF to_regclass('public.admin_settings') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_settings' AND column_name='updated_by') THEN
    CREATE INDEX IF NOT EXISTS admin_settings_updated_by_idx ON public.admin_settings (updated_by);
  END IF;

  IF to_regclass('public.content_library') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_library' AND column_name='source_id') THEN
    CREATE INDEX IF NOT EXISTS content_library_source_id_idx ON public.content_library (source_id);
  END IF;

  IF to_regclass('public.content_revisions') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='content_revisions' AND column_name='changed_by') THEN
    CREATE INDEX IF NOT EXISTS content_revisions_changed_by_idx ON public.content_revisions (changed_by);
  END IF;

  IF to_regclass('public.kids_game_questions') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='kids_game_questions' AND column_name='source_id') THEN
    CREATE INDEX IF NOT EXISTS kids_game_questions_source_id_idx ON public.kids_game_questions (source_id);
  END IF;

  IF to_regclass('public.media_assets') IS NOT NULL
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='media_assets' AND column_name='source_id') THEN
    CREATE INDEX IF NOT EXISTS media_assets_source_id_idx ON public.media_assets (source_id);
  END IF;
END $$;
