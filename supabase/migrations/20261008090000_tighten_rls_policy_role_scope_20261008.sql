-- Tighten RLS policy role scope without changing row-level authorization logic.
-- Broad admin policies that duplicate per-action admin policies are retired.
-- Remaining admin/user policies are limited to authenticated application roles.

do $$
declare
  r record;
begin
  -- These broad ALL policies duplicate the explicit admin_all_* INSERT/UPDATE/DELETE
  -- policies already present on the same tables.
  for r in
    select * from (values
      ('article_categories','article_categories_admin_write'),
      ('dua_categories','dua_categories_admin_write'),
      ('duas','duas_admin_write'),
      ('hadith_books','content_admin_write_books'),
      ('hadith_explanations','content_admin_write_hadith_explanations'),
      ('kids_content','kids_content_admin_write'),
      ('prophet_sections','prophet_sections_admin_write'),
      ('prophets','prophets_admin_write'),
      ('quran_ayahs','content_admin_write_ayahs'),
      ('quran_reciters','content_admin_write_reciters'),
      ('quran_surahs','content_admin_write_surahs'),
      ('quran_tafsir','content_admin_write_tafsir')
    ) as v(table_name, policy_name)
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      r.policy_name,
      r.table_name
    );
  end loop;

  -- Remaining admin policies should never be evaluated for anonymous/public users.
  for r in
    select * from (values
      ('articles','articles_admin_write'),
      ('battles','battles_admin_write_delete'),
      ('battles','battles_admin_write_insert'),
      ('battles','battles_admin_write_update'),
      ('companions','companions_admin_write_delete'),
      ('companions','companions_admin_write_insert'),
      ('companions','companions_admin_write_update'),
      ('conquests','conquests_admin_write_delete'),
      ('conquests','conquests_admin_write_insert'),
      ('conquests','conquests_admin_write_update'),
      ('contacts','contacts_admin_read'),
      ('social_publish_queue','social_publish_queue_admin_write')
    ) as v(table_name, policy_name)
  loop
    execute format(
      'alter policy %I on public.%I to authenticated, dashboard_user, supabase_privileged_role',
      r.policy_name,
      r.table_name
    );
  end loop;

  -- Owner-scoped application data is authenticated-user data.
  for r in
    select * from (values
      ('favorites','favorites_owner_all'),
      ('prayer_locations','allow_user_delete_locations'),
      ('prayer_locations','allow_user_insert_locations'),
      ('prayer_locations','allow_user_read_own_locations'),
      ('prayer_locations','allow_user_update_locations'),
      ('prayer_preferences','allow_user_insert_preferences'),
      ('prayer_preferences','allow_user_manage_preferences'),
      ('prayer_preferences','allow_user_update_preferences'),
      ('reading_progress','reading_progress_owner_all'),
      ('recent_recitations','recent_recitations_owner_all'),
      ('reciter_favorites','reciter_favorites_owner_all'),
      ('reminders','reminders_owner_all'),
      ('tawasheeh_favorites','tawasheeh_favorites_owner_all'),
      ('tawasheeh_playlist_items','tawasheeh_playlist_items_owner_all'),
      ('user_behavior','allow_user_insert_behavior'),
      ('user_behavior','allow_user_view_own_behavior')
    ) as v(table_name, policy_name)
  loop
    execute format(
      'alter policy %I on public.%I to authenticated',
      r.policy_name,
      r.table_name
    );
  end loop;
end $$;
