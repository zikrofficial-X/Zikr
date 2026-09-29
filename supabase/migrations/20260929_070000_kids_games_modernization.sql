-- Kids Games Modernization Schema (Sept 29, 2026)
-- Complete overhaul of kids games system with progress tracking and achievements

-- Drop old tables if they exist
DROP TABLE IF EXISTS public.kids_game_results CASCADE;
DROP TABLE IF EXISTS public.kids_game_progress CASCADE;
DROP TABLE IF EXISTS public.kids_achievements CASCADE;
DROP TABLE IF EXISTS public.kids_character_selection CASCADE;

-- Create kids game progress table
CREATE TABLE public.kids_game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL,
  best_score INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Create kids game results table
CREATE TABLE public.kids_game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  collectibles INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'easy',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create kids achievements table
CREATE TABLE public.kids_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  title_ar TEXT,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  icon_emoji TEXT DEFAULT '🎮',
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create kids character selection table
CREATE TABLE public.kids_character_selection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  character_id TEXT NOT NULL,
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.kids_game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_character_selection ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kids_game_progress
CREATE POLICY "Users can view their own game progress"
  ON public.kids_game_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game progress"
  ON public.kids_game_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game progress"
  ON public.kids_game_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for kids_game_results
CREATE POLICY "Users can view their own game results"
  ON public.kids_game_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game results"
  ON public.kids_game_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kids_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.kids_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.kids_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kids_character_selection
CREATE POLICY "Users can view their own character selection"
  ON public.kids_character_selection FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own character selection"
  ON public.kids_character_selection FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own character selection"
  ON public.kids_character_selection FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_kids_game_progress_user_id ON public.kids_game_progress(user_id);
CREATE INDEX idx_kids_game_progress_game_id ON public.kids_game_progress(game_id);
CREATE INDEX idx_kids_game_progress_user_game ON public.kids_game_progress(user_id, game_id);
CREATE INDEX idx_kids_game_results_user_id ON public.kids_game_results(user_id);
CREATE INDEX idx_kids_game_results_game_id ON public.kids_game_results(game_id);
CREATE INDEX idx_kids_game_results_completed_at ON public.kids_game_results(completed_at);
CREATE INDEX idx_kids_achievements_user_id ON public.kids_achievements(user_id);
CREATE INDEX idx_kids_character_selection_user_id ON public.kids_character_selection(user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.kids_game_progress TO authenticated;
GRANT SELECT, INSERT ON public.kids_game_results TO authenticated;
GRANT SELECT, INSERT ON public.kids_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.kids_character_selection TO authenticated;

-- Trigger to update kids_game_progress timestamp
CREATE OR REPLACE FUNCTION update_kids_game_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kids_game_progress_updated_at
  BEFORE UPDATE ON public.kids_game_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_kids_game_progress_timestamp();

-- Trigger to update kids_character_selection timestamp
CREATE OR REPLACE FUNCTION update_kids_character_selection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kids_character_selection_updated_at
  BEFORE UPDATE ON public.kids_character_selection
  FOR EACH ROW
  EXECUTE FUNCTION update_kids_character_selection_timestamp();
