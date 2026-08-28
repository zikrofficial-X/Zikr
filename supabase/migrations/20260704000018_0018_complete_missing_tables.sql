-- Complete missing tables for Zikr project
-- This migration adds all tables required by the application

-- Quran audio and reciter tables
CREATE TABLE IF NOT EXISTS public.quran_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_id INTEGER NOT NULL,
  ayah_id INTEGER,
  reciter_id UUID,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (reciter_id) REFERENCES public.quran_reciters(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.quran_reciters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  biography_ar TEXT,
  biography_en TEXT,
  recitation_type TEXT, -- tajweed, mualim, etc
  cover_image_url TEXT,
  country TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Dua categories
CREATE TABLE IF NOT EXISTS public.dua_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  icon_emoji TEXT,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Article categories
CREATE TABLE IF NOT EXISTS public.article_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon_emoji TEXT,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Prophet sections
CREATE TABLE IF NOT EXISTS public.prophet_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prophet_id UUID NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  section_type TEXT, -- biography, teachings, miracles, etc
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (prophet_id) REFERENCES public.prophets(id) ON DELETE CASCADE
);

-- Companion stories
CREATE TABLE IF NOT EXISTS public.companion_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id UUID NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  story_ar TEXT NOT NULL,
  story_en TEXT,
  story_type TEXT, -- conversion, jihad, leadership, etc
  order_index INTEGER,
  "references" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (companion_id) REFERENCES public.companions(id) ON DELETE CASCADE
);

-- Prayer locations and preferences
CREATE TABLE IF NOT EXISTS public.prayer_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  timezone TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, is_primary)
);

CREATE TABLE IF NOT EXISTS public.prayer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  calculation_method TEXT DEFAULT 'umm-al-qura', -- umm-al-qura, muslim-world-league, etc
  madhab TEXT DEFAULT 'shafi', -- shafi, hanafi
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_before_minutes INTEGER DEFAULT 15,
  notification_type TEXT DEFAULT 'notification', -- notification, email, both
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.prayer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prayer_name TEXT NOT NULL, -- Fajr, Dhuhr, Asr, Maghrib, Isha
  prayer_date DATE NOT NULL,
  prayer_time TIME NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, prayer_date, prayer_name)
);

-- Tawasheeh tables
CREATE TABLE IF NOT EXISTS public.tawasheeh (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  artist_ar TEXT NOT NULL,
  artist_en TEXT,
  category_id UUID,
  description_ar TEXT,
  description_en TEXT,
  audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  duration_seconds INTEGER,
  lyrics_ar TEXT,
  lyrics_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (category_id) REFERENCES public.tawasheeh_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.tawasheeh_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  icon_emoji TEXT,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tawasheeh_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.tawasheeh_playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL,
  tawasheeh_id UUID NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (playlist_id) REFERENCES public.tawasheeh_playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (tawasheeh_id) REFERENCES public.tawasheeh(id) ON DELETE CASCADE,
  UNIQUE(playlist_id, tawasheeh_id)
);

CREATE TABLE IF NOT EXISTS public.tawasheeh_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tawasheeh_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (tawasheeh_id) REFERENCES public.tawasheeh(id) ON DELETE CASCADE,
  UNIQUE(user_id, tawasheeh_id)
);

-- Battle events and conquest events
CREATE TABLE IF NOT EXISTS public.battle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  event_date DATE,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (battle_id) REFERENCES public.battles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.conquest_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conquest_id UUID NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  event_date DATE,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (conquest_id) REFERENCES public.conquests(id) ON DELETE CASCADE
);

-- Kids content table
CREATE TABLE IF NOT EXISTS public.kids_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  category TEXT NOT NULL, -- stories, quizzes, games, learning, etc
  age_group TEXT NOT NULL, -- 3-5, 6-8, 9-12, 13-15
  cover_image_url TEXT,
  audio_url TEXT,
  duration_minutes INTEGER,
  learning_objectives_ar TEXT,
  learning_objectives_en TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User behavior tracking
CREATE TABLE IF NOT EXISTS public.user_behavior (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action_type TEXT NOT NULL, -- view, read, listen, search, share, etc
  content_type TEXT, -- quran, hadith, dua, article, etc
  content_id UUID,
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Recent recitations tracking
CREATE TABLE IF NOT EXISTS public.recent_recitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reciter_id UUID,
  surah_id INTEGER,
  ayah_start INTEGER,
  ayah_end INTEGER,
  listened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (reciter_id) REFERENCES public.quran_reciters(id) ON DELETE SET NULL
);

-- User subscriptions relation table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  subscription_id UUID,
  tier TEXT, -- free, premium, pro
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL
);

-- Video categories (if missing)
CREATE TABLE IF NOT EXISTS public.video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon_emoji TEXT,
  order_index INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Guard: several tables here were already created by 0010/0013 WITHOUT the
-- is_active column (their CREATE TABLE IF NOT EXISTS above is then a no-op),
-- so the column must be backfilled before policies reference it.
ALTER TABLE IF EXISTS public.dua_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.article_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.tawasheeh_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.video_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.kids_content ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS public.tawasheeh ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Enable RLS on all new tables
ALTER TABLE public.quran_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dua_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prophet_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tawasheeh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tawasheeh_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tawasheeh_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tawasheeh_playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tawasheeh_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquest_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_recitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Public read, admin write where needed)

-- quran_audio and reciters: public read only
DROP POLICY IF EXISTS "allow_public_read" ON public.quran_audio;
CREATE POLICY "allow_public_read" ON public.quran_audio FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_public_read" ON public.quran_reciters;
CREATE POLICY "allow_public_read" ON public.quran_reciters FOR SELECT USING (true);

-- Categories: public read only
DROP POLICY IF EXISTS "allow_public_read" ON public.dua_categories;
CREATE POLICY "allow_public_read" ON public.dua_categories FOR SELECT USING (is_active);
DROP POLICY IF EXISTS "allow_public_read" ON public.article_categories;
CREATE POLICY "allow_public_read" ON public.article_categories FOR SELECT USING (is_active);
DROP POLICY IF EXISTS "allow_public_read" ON public.tawasheeh_categories;
CREATE POLICY "allow_public_read" ON public.tawasheeh_categories FOR SELECT USING (is_active);
DROP POLICY IF EXISTS "allow_public_read" ON public.video_categories;
CREATE POLICY "allow_public_read" ON public.video_categories FOR SELECT USING (is_active);

-- Sections and stories: public read only
DROP POLICY IF EXISTS "allow_public_read" ON public.prophet_sections;
CREATE POLICY "allow_public_read" ON public.prophet_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_public_read" ON public.companion_stories;
CREATE POLICY "allow_public_read" ON public.companion_stories FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_public_read" ON public.battle_events;
CREATE POLICY "allow_public_read" ON public.battle_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_public_read" ON public.conquest_events;
CREATE POLICY "allow_public_read" ON public.conquest_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_public_read" ON public.kids_content;
CREATE POLICY "allow_public_read" ON public.kids_content FOR SELECT USING (is_active);

-- Tawasheeh: public read
DROP POLICY IF EXISTS "allow_public_read" ON public.tawasheeh;
CREATE POLICY "allow_public_read" ON public.tawasheeh FOR SELECT USING (is_active);

-- User-specific policies
DROP POLICY IF EXISTS "allow_user_read_own_locations" ON public.prayer_locations;
CREATE POLICY "allow_user_read_own_locations" ON public.prayer_locations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "allow_user_insert_locations" ON public.prayer_locations;
CREATE POLICY "allow_user_insert_locations" ON public.prayer_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "allow_user_update_locations" ON public.prayer_locations;
CREATE POLICY "allow_user_update_locations" ON public.prayer_locations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "allow_user_delete_locations" ON public.prayer_locations;
CREATE POLICY "allow_user_delete_locations" ON public.prayer_locations FOR DELETE USING (auth.uid() = user_id);

-- NOTE: distinct policy names per command (a single name cannot be reused on
-- the same table for multiple commands).
DROP POLICY IF EXISTS "allow_user_manage_preferences" ON public.prayer_preferences;
CREATE POLICY "allow_user_manage_preferences" ON public.prayer_preferences FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "allow_user_insert_preferences" ON public.prayer_preferences;
CREATE POLICY "allow_user_insert_preferences" ON public.prayer_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "allow_user_update_preferences" ON public.prayer_preferences;
CREATE POLICY "allow_user_update_preferences" ON public.prayer_preferences FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "allow_user_read_own_playlists" ON public.tawasheeh_playlists;
CREATE POLICY "allow_user_read_own_playlists" ON public.tawasheeh_playlists FOR SELECT USING (auth.uid() = user_id OR is_public);
DROP POLICY IF EXISTS "allow_user_insert_playlists" ON public.tawasheeh_playlists;
CREATE POLICY "allow_user_insert_playlists" ON public.tawasheeh_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "allow_user_update_playlists" ON public.tawasheeh_playlists;
CREATE POLICY "allow_user_update_playlists" ON public.tawasheeh_playlists FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "allow_user_manage_favorites" ON public.tawasheeh_favorites;
CREATE POLICY "allow_user_manage_favorites" ON public.tawasheeh_favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "allow_user_insert_favorites" ON public.tawasheeh_favorites;
CREATE POLICY "allow_user_insert_favorites" ON public.tawasheeh_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "allow_user_delete_favorites" ON public.tawasheeh_favorites;
CREATE POLICY "allow_user_delete_favorites" ON public.tawasheeh_favorites FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "allow_user_view_own_behavior" ON public.user_behavior;
CREATE POLICY "allow_user_view_own_behavior" ON public.user_behavior FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "allow_user_insert_behavior" ON public.user_behavior;
CREATE POLICY "allow_user_insert_behavior" ON public.user_behavior FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "allow_user_read_own_subscriptions" ON public.user_subscriptions;
CREATE POLICY "allow_user_read_own_subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quran_audio_surah ON public.quran_audio(surah_id);
CREATE INDEX IF NOT EXISTS idx_quran_audio_reciter ON public.quran_audio(reciter_id);
CREATE INDEX IF NOT EXISTS idx_prophet_sections_prophet ON public.prophet_sections(prophet_id);
CREATE INDEX IF NOT EXISTS idx_companion_stories_companion ON public.companion_stories(companion_id);
CREATE INDEX IF NOT EXISTS idx_prayer_locations_user ON public.prayer_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_preferences_user ON public.prayer_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_tawasheeh_category ON public.tawasheeh(category_id);
CREATE INDEX IF NOT EXISTS idx_tawasheeh_playlists_user ON public.tawasheeh_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_tawasheeh_favorites_user ON public.tawasheeh_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON public.user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created ON public.user_behavior(created_at);
CREATE INDEX IF NOT EXISTS idx_recent_recitations_user ON public.recent_recitations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
