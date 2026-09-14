-- Audit/replay checkpoint. The required partial HeyGen index already existed in production.
create index if not exists idx_video_generation_requests_processing_heygen
  on public.video_generation_requests (updated_at)
  where status = 'processing' and heygen_video_id is not null;
