-- The autonomous FFmpeg worker persists the generated Supabase Storage URL here.
ALTER TABLE public.video_generation_requests
  ADD COLUMN IF NOT EXISTS video_url text;
