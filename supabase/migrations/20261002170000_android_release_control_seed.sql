insert into public.site_settings (key, value, updated_at)
values (
  'android_release',
  '{"mode":"auto","releaseTag":null,"updatedAt":null}'::jsonb,
  now()
)
on conflict (key) do nothing;

insert into public.admin_settings (key, value, description, updated_at)
values (
  'android_release_operation',
  '{"status":"idle","tag":null,"version":null,"versionCode":null,"commitSha":null,"releaseId":null,"releaseUrl":null,"startedAt":null,"startedBy":null}'::jsonb,
  'Private control-plane state for the Android release workflow.',
  now()
)
on conflict (key) do nothing;
