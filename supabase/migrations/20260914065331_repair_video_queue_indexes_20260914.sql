-- Improve FIFO pending-queue lookup for automated video processing.
create index if not exists idx_video_generation_requests_status_created_at
  on public.video_generation_requests (status, created_at);
