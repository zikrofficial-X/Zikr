-- Remove duplicate foreign keys when their optional tables exist.
DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('public.stories'::text, 'stories_user_id_profiles_id_fk'::text),
      ('public.story_progress'::text, 'story_progress_user_id_profiles_id_fk'::text),
      ('public.saved_stories'::text, 'saved_stories_user_id_profiles_id_fk'::text),
      ('public.tasks'::text, 'tasks_user_id_profiles_fkey'::text),
      ('public.profiles'::text, 'profiles_id_auth_users_fk'::text)
    ) AS constraints(table_name, constraint_name)
  LOOP
    IF to_regclass(item.table_name) IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I',
        item.table_name,
        item.constraint_name
      );
    END IF;
  END LOOP;
END
$$;
