insert into public.admin_settings (key, value, description)
values (
  'video_automation_ai_attempts_per_run',
  '4'::jsonb,
  'Maximum free AI video provider attempts per worker cycle before deterministic template fallback.'
)
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    updated_at = now();
