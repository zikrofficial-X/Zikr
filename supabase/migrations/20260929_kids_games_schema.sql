-- Kids Games Schema Migration
-- Created: 2026-09-29

-- Kids Game Progress Table
CREATE TABLE IF NOT EXISTS kids_game_progress (
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

-- Kids Game Results Table
CREATE TABLE IF NOT EXISTS kids_game_results (
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

-- Kids Achievements Table
CREATE TABLE IF NOT EXISTS kids_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  title_ar TEXT,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  icon_emoji TEXT DEFAULT '🏆',
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Kids Character Selection Table
CREATE TABLE IF NOT EXISTS kids_character_selection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  character_id TEXT NOT NULL,
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, character_id)
);

-- Enable RLS
ALTER TABLE kids_game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_character_selection ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kids_game_progress
CREATE POLICY "Users can view their own game progress"
  ON kids_game_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game progress"
  ON kids_game_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game progress"
  ON kids_game_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kids_game_results
CREATE POLICY "Users can view their own game results"
  ON kids_game_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game results"
  ON kids_game_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kids_achievements
CREATE POLICY "Users can view their own achievements"
  ON kids_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON kids_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kids_character_selection
CREATE POLICY "Users can view their own character selection"
  ON kids_character_selection FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own character selection"
  ON kids_character_selection FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_kids_game_progress_user_id ON kids_game_progress(user_id);
CREATE INDEX idx_kids_game_progress_game_id ON kids_game_progress(game_id);
CREATE INDEX idx_kids_game_results_user_id ON kids_game_results(user_id);
CREATE INDEX idx_kids_game_results_game_id ON kids_game_results(game_id);
CREATE INDEX idx_kids_achievements_user_id ON kids_achievements(user_id);
CREATE INDEX idx_kids_character_selection_user_id ON kids_character_selection(user_id);
