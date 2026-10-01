alter table public.video_generation_requests
  add column if not exists video_url text;
