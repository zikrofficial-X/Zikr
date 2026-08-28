-- Add error tracking columns used by the video automation service
ALTER TABLE video_generation_requests ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE video_generation_requests ADD COLUMN IF NOT EXISTS error_details text;
