-- Keep the Admin controls aligned with the protected GitHub video worker defaults.
-- Existing operator values are preserved; only missing runtime settings are seeded.
insert into public.admin_settings (key, value, description)
values
  (
    'video_automation_ai_attempts_per_run',
    '2'::jsonb,
    'Maximum AI video provider attempts per worker cycle before the deterministic FFmpeg fallback.'
  ),
  (
    'video_automation_video_seconds',
    '25'::jsonb,
    'Default duration in seconds for generated video assets.'
  )
on conflict (key) do nothing;
