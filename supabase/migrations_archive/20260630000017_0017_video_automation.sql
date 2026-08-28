-- Video Generation Requests Table
CREATE TABLE video_generation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('quran', 'hadith', 'story', 'dua', 'adhkar')),
  content jsonb NOT NULL,
  duration integer,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  youtube_id text,
  facebook_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Video Publishing Config Table
CREATE TABLE video_publishing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_enabled boolean DEFAULT false,
  youtube_channel_id text,
  facebook_enabled boolean DEFAULT false,
  facebook_page_id text,
  auto_publish boolean DEFAULT false,
  publish_schedule text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_publishing_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "select_video_requests_admin" ON video_generation_requests 
FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "insert_video_requests_admin" ON video_generation_requests 
FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "update_video_requests_admin" ON video_generation_requests 
FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "select_video_config_admin" ON video_publishing_config 
FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "update_video_config_admin" ON video_publishing_config 
FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Indexes
CREATE INDEX idx_video_requests_status ON video_generation_requests(status);
CREATE INDEX idx_video_requests_category ON video_generation_requests(category);
CREATE INDEX idx_video_requests_created_at ON video_generation_requests(created_at DESC);
