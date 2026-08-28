-- ============================================================
-- Migration 0010: Full schema sync + RLS policies
-- Adds all tables missing from previous migrations and enables
-- Row Level Security on every user-owned table.
-- ============================================================

-- ==================== ENUMS (idempotent) ====================
DO $$ BEGIN
  CREATE TYPE role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE favorite_item_type AS ENUM ('quran','hadith','story','scholar','dua');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE progress_scope AS ENUM ('quran','hadith','stories');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_type AS ENUM ('prayer','quran','adhkar','fasting','zakat');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE plan AS ENUM ('free','pro','premium');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE status AS ENUM ('pending','completed','failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==================== PUBLIC CONTENT TABLES ====================

-- Duas
CREATE TABLE IF NOT EXISTS dua_categories (
  id UUID PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS duas (
  id UUID PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  text_ar TEXT NOT NULL,
  text_en TEXT,
  occasion_ar TEXT,
  occasion_en TEXT,
  source_ar TEXT,
  source_en TEXT,
  benefits_ar TEXT,
  benefits_en TEXT,
  category_id UUID REFERENCES dua_categories(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prophets
CREATE TABLE IF NOT EXISTS prophets (
  id UUID PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio_ar TEXT,
  bio_en TEXT,
  birth_place_ar TEXT,
  death_place_ar TEXT,
  featured_image_url TEXT,
  thumbnail_url TEXT,
  order_num INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prophet_sections (
  id UUID PRIMARY KEY,
  prophet_id UUID NOT NULL REFERENCES prophets(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  section_type TEXT,
  order_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Videos
CREATE TABLE IF NOT EXISTS video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  icon TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES video_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  youtube_id TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  views INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kids content
CREATE TABLE IF NOT EXISTS kids_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  content_ar TEXT,
  content_en TEXT,
  age_group TEXT NOT NULL,
  featured_image_url TEXT,
  video_url TEXT,
  quiz_data JSONB,
  published BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Battles & Conquests
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  date_hijri TEXT,
  date_gregorian TEXT,
  location_ar TEXT,
  location_en TEXT,
  thumbnail_url TEXT,
  featured_image_url TEXT,
  order_num INTEGER,
  published BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS battle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  event_type TEXT,
  order_num INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conquests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  date_hijri TEXT,
  date_gregorian TEXT,
  location_ar TEXT,
  location_en TEXT,
  leader_ar TEXT,
  leader_en TEXT,
  thumbnail_url TEXT,
  featured_image_url TEXT,
  order_num INTEGER,
  published BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conquest_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conquest_id UUID NOT NULL REFERENCES conquests(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  event_type TEXT,
  order_num INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tawasheeh
CREATE TABLE IF NOT EXISTS tawasheeh_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  icon TEXT,
  order_num INTEGER,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tawasheeh (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  artist_ar TEXT,
  artist_en TEXT,
  category_id UUID REFERENCES tawasheeh_categories(id) ON DELETE SET NULL,
  audio_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  views INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== USER-OWNED PRAYER TABLES ====================

CREATE TABLE IF NOT EXISTS prayer_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  country TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  timezone TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prayer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  calculation_method TEXT DEFAULT 'umm-al-qura',
  madhab TEXT DEFAULT 'shafi',
  high_latitude_method TEXT DEFAULT 'middle-of-night',
  asr_method TEXT DEFAULT 'shafi',
  midnight_method TEXT DEFAULT 'standard',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  adhan_enabled BOOLEAN NOT NULL DEFAULT true,
  adhan_volume INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prayer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prayer_name TEXT NOT NULL,
  notification_time TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== AUDIO INTERACTION TABLES ====================

CREATE TABLE IF NOT EXISTS reciter_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reciter_id UUID NOT NULL REFERENCES quran_reciters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, reciter_id)
);

CREATE TABLE IF NOT EXISTS recent_recitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reciter_id UUID NOT NULL REFERENCES quran_reciters(id) ON DELETE CASCADE,
  surah_id INTEGER NOT NULL,
  ayah_number INTEGER,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_listened INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tawasheeh user tables
CREATE TABLE IF NOT EXISTS tawasheeh_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tawasheeh_id UUID NOT NULL REFERENCES tawasheeh(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tawasheeh_id)
);

CREATE TABLE IF NOT EXISTS tawasheeh_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tawasheeh_playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES tawasheeh_playlists(id) ON DELETE CASCADE,
  tawasheeh_id UUID NOT NULL REFERENCES tawasheeh(id) ON DELETE CASCADE,
  order_num INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== MISC TABLES ====================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar',
  read BOOLEAN NOT NULL DEFAULT false,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  prize TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  body TEXT,
  type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memorization_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  cadence TEXT NOT NULL DEFAULT 'daily',
  target_ref TEXT,
  prompt TEXT,
  tajweed_focus TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  content JSONB NOT NULL,
  duration INTEGER,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  youtube_id TEXT,
  facebook_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_publishing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_enabled BOOLEAN NOT NULL DEFAULT false,
  youtube_channel_id TEXT,
  facebook_enabled BOOLEAN NOT NULL DEFAULT false,
  facebook_page_id TEXT,
  auto_publish BOOLEAN NOT NULL DEFAULT false,
  publish_schedule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== ADDITIONAL INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_duas_slug ON duas(slug);
CREATE INDEX IF NOT EXISTS idx_duas_category ON duas(category_id);
CREATE INDEX IF NOT EXISTS idx_prophets_slug ON prophets(slug);
CREATE INDEX IF NOT EXISTS idx_prophet_sections_prophet_id ON prophet_sections(prophet_id);
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_battles_slug ON battles(slug);
CREATE INDEX IF NOT EXISTS idx_conquests_slug ON conquests(slug);
CREATE INDEX IF NOT EXISTS idx_tawasheeh_slug ON tawasheeh(slug);
CREATE INDEX IF NOT EXISTS idx_tawasheeh_category ON tawasheeh(category_id);
CREATE INDEX IF NOT EXISTS idx_prayer_locations_user_id ON prayer_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_preferences_user_id ON prayer_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_reciter_favorites_user_id ON reciter_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_recitations_user_id ON recent_recitations(user_id);
CREATE INDEX IF NOT EXISTS idx_tawasheeh_favorites_user_id ON tawasheeh_favorites(user_id);

-- ==================== ROW LEVEL SECURITY ====================
-- Enable RLS on every user-owned table and add standard CRUD policies.
-- Public content tables remain read-only via anon key (no RLS needed
-- as long as they are not RLS-enabled; leave them open by default).

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites_all_own" ON favorites;
CREATE POLICY "favorites_all_own" ON favorites USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- reading_progress
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reading_progress_all_own" ON reading_progress;
CREATE POLICY "reading_progress_all_own" ON reading_progress USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reminders_all_own" ON reminders;
CREATE POLICY "reminders_all_own" ON reminders USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- quran_favorites
ALTER TABLE quran_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quran_favorites_all_own" ON quran_favorites;
CREATE POLICY "quran_favorites_all_own" ON quran_favorites USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookmarks_all_own" ON bookmarks;
CREATE POLICY "bookmarks_all_own" ON bookmarks USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- search_history
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "search_history_all_own" ON search_history;
CREATE POLICY "search_history_all_own" ON search_history USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- quran_reads
ALTER TABLE quran_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quran_reads_all_own" ON quran_reads;
CREATE POLICY "quran_reads_all_own" ON quran_reads USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- story_reads
ALTER TABLE story_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_reads_all_own" ON story_reads;
CREATE POLICY "story_reads_all_own" ON story_reads USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- story_ratings
ALTER TABLE story_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_ratings_all_own" ON story_ratings;
CREATE POLICY "story_ratings_all_own" ON story_ratings USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- story_favorites
ALTER TABLE story_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_favorites_all_own" ON story_favorites;
CREATE POLICY "story_favorites_all_own" ON story_favorites USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- social_shares
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_shares_all_own" ON social_shares;
CREATE POLICY "social_shares_all_own" ON social_shares USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- prophet_notes
ALTER TABLE prophet_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prophet_notes_all_own" ON prophet_notes;
CREATE POLICY "prophet_notes_all_own" ON prophet_notes USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_settings_all_own" ON notification_settings;
CREATE POLICY "notification_settings_all_own" ON notification_settings USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- adhkar_completions
ALTER TABLE adhkar_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "adhkar_completions_all_own" ON adhkar_completions;
CREATE POLICY "adhkar_completions_all_own" ON adhkar_completions USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- adhkar_streaks
ALTER TABLE adhkar_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "adhkar_streaks_all_own" ON adhkar_streaks;
CREATE POLICY "adhkar_streaks_all_own" ON adhkar_streaks USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_all_own" ON app_settings;
CREATE POLICY "app_settings_all_own" ON app_settings USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- prayer_locations
ALTER TABLE prayer_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prayer_locations_all_own" ON prayer_locations;
CREATE POLICY "prayer_locations_all_own" ON prayer_locations USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- prayer_preferences
ALTER TABLE prayer_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prayer_preferences_all_own" ON prayer_preferences;
CREATE POLICY "prayer_preferences_all_own" ON prayer_preferences USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- prayer_notifications
ALTER TABLE prayer_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prayer_notifications_select_own" ON prayer_notifications;
CREATE POLICY "prayer_notifications_select_own" ON prayer_notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "prayer_notifications_insert_own" ON prayer_notifications;
CREATE POLICY "prayer_notifications_insert_own" ON prayer_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- reciter_favorites
ALTER TABLE reciter_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reciter_favorites_all_own" ON reciter_favorites;
CREATE POLICY "reciter_favorites_all_own" ON reciter_favorites USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- recent_recitations
ALTER TABLE recent_recitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recent_recitations_all_own" ON recent_recitations;
CREATE POLICY "recent_recitations_all_own" ON recent_recitations USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tawasheeh_favorites
ALTER TABLE tawasheeh_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tawasheeh_favorites_all_own" ON tawasheeh_favorites;
CREATE POLICY "tawasheeh_favorites_all_own" ON tawasheeh_favorites USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tawasheeh_playlists
ALTER TABLE tawasheeh_playlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tawasheeh_playlists_all_own" ON tawasheeh_playlists;
CREATE POLICY "tawasheeh_playlists_all_own" ON tawasheeh_playlists USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tawasheeh_playlist_items (accessible via playlist ownership)
ALTER TABLE tawasheeh_playlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tawasheeh_playlist_items_all_own" ON tawasheeh_playlist_items;
CREATE POLICY "tawasheeh_playlist_items_all_own" ON tawasheeh_playlist_items
  USING (EXISTS (SELECT 1 FROM tawasheeh_playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM tawasheeh_playlists p WHERE p.id = playlist_id AND p.user_id = auth.uid()));

-- user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_subscriptions_select_own" ON user_subscriptions;
CREATE POLICY "user_subscriptions_select_own" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ==================== PUBLIC READ POLICIES ====================
-- Allow anon + authenticated to read public content tables.

ALTER TABLE quran_surahs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quran_surahs_public_read" ON quran_surahs;
CREATE POLICY "quran_surahs_public_read" ON quran_surahs FOR SELECT USING (true);

ALTER TABLE quran_ayahs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quran_ayahs_public_read" ON quran_ayahs;
CREATE POLICY "quran_ayahs_public_read" ON quran_ayahs FOR SELECT USING (true);

ALTER TABLE quran_tafsir ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quran_tafsir_public_read" ON quran_tafsir;
CREATE POLICY "quran_tafsir_public_read" ON quran_tafsir FOR SELECT USING (true);

ALTER TABLE quran_reciters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quran_reciters_public_read" ON quran_reciters;
CREATE POLICY "quran_reciters_public_read" ON quran_reciters FOR SELECT USING (true);

ALTER TABLE quran_audio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quran_audio_public_read" ON quran_audio;
CREATE POLICY "quran_audio_public_read" ON quran_audio FOR SELECT USING (true);

ALTER TABLE hadith_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hadith_books_public_read" ON hadith_books;
CREATE POLICY "hadith_books_public_read" ON hadith_books FOR SELECT USING (true);

ALTER TABLE hadiths ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hadiths_public_read" ON hadiths;
CREATE POLICY "hadiths_public_read" ON hadiths FOR SELECT USING (published = true);

ALTER TABLE scholars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scholars_public_read" ON scholars;
CREATE POLICY "scholars_public_read" ON scholars FOR SELECT USING (published = true);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stories_public_read" ON stories;
CREATE POLICY "stories_public_read" ON stories FOR SELECT USING (published = true);

ALTER TABLE prophets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prophets_public_read" ON prophets;
CREATE POLICY "prophets_public_read" ON prophets FOR SELECT USING (published = true);

ALTER TABLE prophet_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prophet_sections_public_read" ON prophet_sections;
CREATE POLICY "prophet_sections_public_read" ON prophet_sections FOR SELECT USING (true);

ALTER TABLE duas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "duas_public_read" ON duas;
CREATE POLICY "duas_public_read" ON duas FOR SELECT USING (published = true);

ALTER TABLE dua_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dua_categories_public_read" ON dua_categories;
CREATE POLICY "dua_categories_public_read" ON dua_categories FOR SELECT USING (published = true);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "articles_public_read" ON articles;
CREATE POLICY "articles_public_read" ON articles FOR SELECT USING (published = true);

ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "article_categories_public_read" ON article_categories;
CREATE POLICY "article_categories_public_read" ON article_categories FOR SELECT USING (published = true);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "videos_public_read" ON videos;
CREATE POLICY "videos_public_read" ON videos FOR SELECT USING (published = true);

ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "battles_public_read" ON battles;
CREATE POLICY "battles_public_read" ON battles FOR SELECT USING (published = true);

ALTER TABLE conquests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conquests_public_read" ON conquests;
CREATE POLICY "conquests_public_read" ON conquests FOR SELECT USING (published = true);

ALTER TABLE tawasheeh ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tawasheeh_public_read" ON tawasheeh;
CREATE POLICY "tawasheeh_public_read" ON tawasheeh FOR SELECT USING (published = true);

ALTER TABLE tawasheeh_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tawasheeh_categories_public_read" ON tawasheeh_categories;
CREATE POLICY "tawasheeh_categories_public_read" ON tawasheeh_categories FOR SELECT USING (published = true);

ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "companions_public_read" ON companions;
CREATE POLICY "companions_public_read" ON companions FOR SELECT USING (published = true);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "competitions_public_read" ON competitions;
CREATE POLICY "competitions_public_read" ON competitions FOR SELECT USING (published = true);

ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pinned_messages_public_read" ON pinned_messages;
CREATE POLICY "pinned_messages_public_read" ON pinned_messages FOR SELECT USING (is_active = true);

ALTER TABLE memorization_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "memorization_plans_public_read" ON memorization_plans;
CREATE POLICY "memorization_plans_public_read" ON memorization_plans FOR SELECT USING (published = true);
