-- Restrict admin-only policies when the optional tables and policies exist.
DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('public.battles'::text, 'battles_admin_write'::text),
      ('public.companions'::text, 'companions_admin_write'::text),
      ('public.conquests'::text, 'conquests_admin_write'::text),
      ('public.render_jobs'::text, 'Admins can manage render jobs'::text),
      ('public.video_publish_log'::text, 'Admins can manage publish log'::text)
    ) AS policies(table_name, policy_name)
  LOOP
    IF to_regclass(item.table_name) IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM pg_policies
         WHERE schemaname = split_part(item.table_name, '.', 1)
           AND tablename = split_part(item.table_name, '.', 2)
           AND policyname = item.policy_name
       ) THEN
      EXECUTE format(
        'ALTER POLICY %I ON %s TO authenticated',
        item.policy_name,
        item.table_name
      );
    END IF;
  END LOOP;
END
$$;
