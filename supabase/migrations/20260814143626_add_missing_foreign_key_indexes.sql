-- Cover foreign keys reported by Supabase's performance advisor.
-- Optional tables are guarded so the migration replay remains portable across
-- lightweight validation databases and full production databases.
DO $$
DECLARE
  index_row record;
BEGIN
  FOR index_row IN
    SELECT * FROM (VALUES
      ('ai_history', 'user_id', 'ai_history_user_id_idx'),
      ('favorite_recitations', 'reciter_id', 'favorite_recitations_reciter_id_idx'),
      ('memorization_attempts', 'user_id', 'memorization_attempts_user_id_idx'),
      ('recent_recitations', 'reciter_id', 'recent_recitations_reciter_id_idx'),
      ('reciter_favorites', 'reciter_id', 'reciter_favorites_reciter_id_idx'),
      ('story_favorites', 'story_id', 'story_favorites_story_id_idx'),
      ('story_reads', 'story_id', 'story_reads_story_id_idx'),
      ('tawasheeh_favorites', 'tawasheeh_id', 'tawasheeh_favorites_tawasheeh_id_idx'),
      ('tawasheeh_playlist_items', 'tawasheeh_id', 'tawasheeh_playlist_items_tawasheeh_id_idx'),
      ('user_settings', 'default_reciter_id', 'user_settings_default_reciter_id_idx')
    ) AS v(table_name, column_name, index_name)
  LOOP
    IF to_regclass(format('public.%I', index_row.table_name)) IS NOT NULL THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)',
        index_row.index_name,
        index_row.table_name,
        index_row.column_name
      );
    END IF;
  END LOOP;
END;
$$;
