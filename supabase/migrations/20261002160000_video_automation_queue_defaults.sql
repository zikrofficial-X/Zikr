-- Queue recovery and persistent automation defaults.
-- Keep the worker configuration in Supabase so scheduled runs behave consistently
-- even when GitHub Actions environment defaults change.

insert into public.admin_settings (key, value, description, updated_at)
values
  ('video_automation_enabled', 'true'::jsonb, 'تفعيل تشغيل طابور الفيديو الآلي.', now()),
  ('video_automation_batch_size', '10'::jsonb, 'عدد عمليات الفيديو التي يسمح بتشغيلها في كل دورة.', now()),
  ('video_automation_ai_enabled', 'true'::jsonb, 'تفعيل مزودي المشاهد المرئية مع السقوط الآمن إلى القالب.', now())
on conflict (key) do update
set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();