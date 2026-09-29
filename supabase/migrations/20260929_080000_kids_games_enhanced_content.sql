-- Kids Games Enhanced Content & Free-Tier Narration Schema
-- September 29, 2026
-- Supports graphics, scenarios, and AI narration without cost overhead

-- Drop existing tables if needed
DROP TABLE IF EXISTS public.video_narrations CASCADE;
DROP TABLE IF EXISTS public.game_graphics CASCADE;
DROP TABLE IF EXISTS public.game_scenarios CASCADE;

-- Create game scenarios table
CREATE TABLE public.game_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  age_group TEXT DEFAULT '6-12',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  narrative_intro_ar TEXT,
  narrative_intro_en TEXT,
  narrative_challenge_ar TEXT,
  narrative_challenge_en TEXT,
  narrative_victory_ar TEXT,
  narrative_victory_en TEXT,
  narrative_defeat_ar TEXT,
  narrative_defeat_en TEXT,
  theme_bg_color TEXT DEFAULT '#1a3a3a',
  theme_primary_color TEXT DEFAULT '#d7b56d',
  theme_secondary_color TEXT DEFAULT '#9cc9a5',
  theme_accent_color TEXT DEFAULT '#f8f3e7',
  educational_values TEXT[] DEFAULT ARRAY[]::text[],
  skills_developed TEXT[] DEFAULT ARRAY[]::text[],
  objectives TEXT[] DEFAULT ARRAY[]::text[],
  lesson_plan TEXT[] DEFAULT ARRAY[]::text[],
  graphics_quality TEXT CHECK (graphics_quality IN ('low', 'medium', 'high')) DEFAULT 'high',
  sound_theme TEXT CHECK (sound_theme IN ('adventure', 'learning', 'night', 'active')) DEFAULT 'adventure',
  free_tier BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create game graphics table
CREATE TABLE public.game_graphics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL REFERENCES game_scenarios(game_id) ON DELETE CASCADE,
  character_description TEXT,
  enemy_types TEXT[] DEFAULT ARRAY[]::text[],
  collectible_types TEXT[] DEFAULT ARRAY[]::text[],
  background_descriptions TEXT[] DEFAULT ARRAY[]::text[],
  sprite_urls TEXT[] DEFAULT ARRAY[]::text[],
  animation_descriptions TEXT[] DEFAULT ARRAY[]::text[],
  color_palette JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create video narrations table (for AI-generated audio)
CREATE TABLE public.video_narrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL UNIQUE,
  title TEXT,
  narration_ar TEXT,
  narration_en TEXT,
  audio_url_ar TEXT,
  audio_url_en TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  method TEXT CHECK (method IN ('tts', 'cache', 'custom')) DEFAULT 'tts',
  duration_seconds INTEGER,
  cached BOOLEAN DEFAULT FALSE,
  provider TEXT,
  free_tier BOOLEAN DEFAULT TRUE,
  cost_usd DECIMAL(10, 4) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create free tier usage tracking table
CREATE TABLE public.free_tier_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL,
  service_type TEXT NOT NULL,
  requests_count INTEGER DEFAULT 0,
  characters_processed INTEGER DEFAULT 0,
  videos_generated INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  estimated_cost_if_paid DECIMAL(10, 4) DEFAULT 0.00,
  actual_cost DECIMAL(10, 4) DEFAULT 0.00,
  quota_limit INTEGER,
  quota_used INTEGER,
  quota_remaining INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(month_year, service_type)
);

-- Enable RLS
ALTER TABLE public.game_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_graphics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_narrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_tier_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_scenarios (public read)
CREATE POLICY "Anyone can view game scenarios"
  ON public.game_scenarios FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins only can modify game scenarios"
  ON public.game_scenarios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for game_graphics (public read)
CREATE POLICY "Anyone can view game graphics"
  ON public.game_graphics FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins only can modify game graphics"
  ON public.game_graphics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for video_narrations (public read, admin write)
CREATE POLICY "Anyone can view video narrations"
  ON public.video_narrations FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins only can manage video narrations"
  ON public.video_narrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- RLS Policies for free_tier_usage (admin only)
CREATE POLICY "Admins only can view usage stats"
  ON public.free_tier_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_game_scenarios_game_id ON public.game_scenarios(game_id);
CREATE INDEX idx_game_scenarios_difficulty ON public.game_scenarios(difficulty);
CREATE INDEX idx_game_graphics_game_id ON public.game_graphics(game_id);
CREATE INDEX idx_video_narrations_video_id ON public.video_narrations(video_id);
CREATE INDEX idx_video_narrations_status ON public.video_narrations(status);
CREATE INDEX idx_video_narrations_created ON public.video_narrations(created_at);
CREATE INDEX idx_free_tier_usage_month ON public.free_tier_usage(month_year);
CREATE INDEX idx_free_tier_usage_service ON public.free_tier_usage(service_type);

-- Grant permissions
GRANT SELECT ON public.game_scenarios TO authenticated, anon;
GRANT SELECT ON public.game_graphics TO authenticated, anon;
GRANT SELECT ON public.video_narrations TO authenticated, anon;
GRANT SELECT ON public.free_tier_usage TO authenticated;

-- Create triggers for timestamp updates
CREATE OR REPLACE FUNCTION update_game_scenarios_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_scenarios_updated_at
  BEFORE UPDATE ON public.game_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_game_scenarios_timestamp();

CREATE OR REPLACE FUNCTION update_game_graphics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_graphics_updated_at
  BEFORE UPDATE ON public.game_graphics
  FOR EACH ROW
  EXECUTE FUNCTION update_game_graphics_timestamp();

CREATE OR REPLACE FUNCTION update_video_narrations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_narrations_updated_at
  BEFORE UPDATE ON public.video_narrations
  FOR EACH ROW
  EXECUTE FUNCTION update_video_narrations_timestamp();

-- Seed initial game scenarios data
INSERT INTO public.game_scenarios (
  game_id, title_ar, title_en, age_group, difficulty, sound_theme
) VALUES
  ('zikr-runner', 'عداء الذكر', 'Zikr Runner', '6-12', 'medium', 'adventure'),
  ('zikr-memory', 'لعبة الذاكرة الإسلامية', 'Islamic Memory Game', '5-12', 'easy', 'learning'),
  ('wudu-challenge', 'تحدي الوضوء', 'Wudu Challenge', '5-10', 'easy', 'learning'),
  ('verse-puzzle', 'لغز الآية', 'Verse Puzzle', '7-13', 'medium', 'learning'),
  ('zikr-jump', 'قفزة الذكر', 'Zikr Jump', '6-12', 'medium', 'adventure'),
  ('hilal-fly', 'طيران الهلال', 'Hilal Fly', '7-13', 'hard', 'night'),
  ('zikr-road', 'طريق الذكر', 'Zikr Road', '8-14', 'medium', 'adventure'),
  ('mosque-adventure', 'مغامرة المسجد', 'Mosque Adventure', '6-12', 'easy', 'learning'),
  ('zikr-quiz', 'اختبار الذكر', 'Zikr Quiz', '7-15', 'medium', 'learning'),
  ('good-deeds', 'الأعمال الصالحة', 'Good Deeds', '5-15', 'easy', 'learning'),
  ('mosque-cleanup', 'تنظيف المسجد', 'Mosque Cleanup', '5-12', 'easy', 'learning'),
  ('zikr-coloring', 'تلوين الأذكار', 'Zikr Coloring', '4-12', 'easy', 'learning')
ON CONFLICT (game_id) DO NOTHING;

-- Create view for free tier statistics
CREATE OR REPLACE VIEW free_tier_statistics AS
SELECT
  TO_CHAR(NOW(), 'YYYY-MM') as current_month,
  COUNT(DISTINCT vn.video_id) as total_videos_narrated,
  COUNT(CASE WHEN vn.cached = TRUE THEN 1 END) as cached_narrations,
  COUNT(CASE WHEN vn.free_tier = TRUE THEN 1 END) as free_tier_usage,
  SUM(COALESCE(vn.duration_seconds, 0)) as total_duration_seconds,
  SUM(COALESCE(vn.cost_usd, 0)) as estimated_cost,
  'Zero Cost - Free Tier' as current_plan
FROM public.video_narrations vn
WHERE DATE_TRUNC('month', vn.created_at) = DATE_TRUNC('month', NOW())
GROUP BY TO_CHAR(NOW(), 'YYYY-MM');

-- Grant view access
GRANT SELECT ON free_tier_statistics TO authenticated;

-- Create function to track free tier usage
CREATE OR REPLACE FUNCTION track_free_tier_usage()
RETURNS VOID AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  INSERT INTO public.free_tier_usage (
    month_year,
    service_type,
    requests_count,
    videos_generated,
    cache_hits,
    quota_limit,
    quota_used,
    quota_remaining
  )
  SELECT
    current_month,
    'video_narration',
    COUNT(*),
    COUNT(CASE WHEN status = 'completed' THEN 1 END),
    COUNT(CASE WHEN cached = TRUE THEN 1 END),
    1000000,
    COALESCE(SUM(CHAR_LENGTH(narration_ar) + CHAR_LENGTH(narration_en)), 0),
    1000000 - COALESCE(SUM(CHAR_LENGTH(narration_ar) + CHAR_LENGTH(narration_en)), 0)
  FROM public.video_narrations
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
  ON CONFLICT (month_year, service_type)
  DO UPDATE SET
    requests_count = EXCLUDED.requests_count,
    videos_generated = EXCLUDED.videos_generated,
    cache_hits = EXCLUDED.cache_hits,
    quota_used = EXCLUDED.quota_used,
    quota_remaining = EXCLUDED.quota_remaining,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
