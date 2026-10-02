-- Human/open audio catalogue for adhan, salawat and dhikr.
-- Applied remotely as 20261002160440_human_audio_library_20261002.
update public.site_audio_assets
set is_primary = false
where kind in ('adhan', 'salawat', 'dhikr');

insert into public.site_audio_assets (kind, title, storage_path, mime_type, size_bytes, is_primary)
values
  ('adhan', 'الأذان — Beautiful Adhan', 'curated:adhan:beautiful', 'audio/ogg', 1600000, true),
  ('adhan', 'الأذان — تسجيل بشري قصير', 'curated:adhan:short', 'audio/ogg', 350000, false),
  ('adhan', 'الأذان — تسجيل بشري كامل', 'curated:adhan:full', 'audio/ogg', 1600000, false),
  ('adhan', 'الأذان — تسجيل إسطنبول', 'curated:adhan:istanbul', 'audio/webm', 1100000, false),
  ('salawat', 'الصلاة على النبي ﷺ — تسجيل بشري', 'curated:salawat:muhammad-pbuh', 'audio/wav', 452000, true),
  ('salawat', 'ذكر محمد ﷺ — تسجيل بشري', 'curated:salawat:muhammad', 'audio/wav', 234000, false),
  ('dhikr', 'تسبيح — نطق بشري 1', 'curated:dhikr:subhanallah-1', 'audio/wav', 147000, true),
  ('dhikr', 'تسبيح — نطق بشري 2', 'curated:dhikr:subhanallah-2', 'audio/wav', 91000, false)
on conflict (storage_path) do update set
  kind = excluded.kind,
  title = excluded.title,
  mime_type = excluded.mime_type,
  size_bytes = excluded.size_bytes,
  is_primary = excluded.is_primary,
  updated_at = now();
