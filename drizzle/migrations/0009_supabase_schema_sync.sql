-- Supabase Schema Sync Migration
-- Synchronize all Drizzle schema definitions to ensure consistency between
-- Drizzle ORM type definitions and the actual Supabase database schema.
-- This migration adds all missing user-owned and public content tables.

-- ==================== USER-OWNED TABLES ====================

-- Quran user interactions
CREATE TABLE IF NOT EXISTS quran_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  surah_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, surah_id)
);

CREATE TABLE IF NOT EXISTS quran_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  surah_id INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  item_ref TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Search history
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Story user interactions
CREATE TABLE IF NOT EXISTS story_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

CREATE TABLE IF NOT EXISTS story_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL,
  comment TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

CREATE TABLE IF NOT EXISTS story_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

-- Social sharing
CREATE TABLE IF NOT EXISTS social_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  platform TEXT,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prophet notes
CREATE TABLE IF NOT EXISTS prophet_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prophet_id TEXT NOT NULL,
  note TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, prophet_id)
);

-- Notification settings
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Adhkar tracking
CREATE TABLE IF NOT EXISTS adhkar_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  adhkar_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS adhkar_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  streak INTEGER NOT NULL DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  theme TEXT NOT NULL DEFAULT 'system',
  font_size TEXT NOT NULL DEFAULT 'medium',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== PUBLIC CONTENT TABLES ====================

-- Article categories
CREATE TABLE IF NOT EXISTS article_categories (
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

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES article_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  summary TEXT,
  author TEXT,
  tags TEXT[] DEFAULT '{}',
  featured_image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  views INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Companions
CREATE TABLE IF NOT EXISTS companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio_ar TEXT,
  bio_en TEXT,
  category TEXT,
  thumbnail_url TEXT,
  featured_image_url TEXT,
  order_num INTEGER,
  published BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Companion stories
CREATE TABLE IF NOT EXISTS companion_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  story_type TEXT,
  order_num INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_quran_favorites_user_id ON quran_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_quran_reads_user_id ON quran_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at);
CREATE INDEX IF NOT EXISTS idx_story_reads_user_id ON story_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_story_ratings_user_id ON story_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_story_favorites_user_id ON story_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_content ON social_shares(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_prophet_notes_user_id ON prophet_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_adhkar_completions_user_id ON adhkar_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_adhkar_completions_adhkar_id ON adhkar_completions(adhkar_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_companions_slug ON companions(slug);
CREATE INDEX IF NOT EXISTS idx_companion_stories_companion_id ON companion_stories(companion_id);
CREATE INDEX IF NOT EXISTS idx_article_categories_slug ON article_categories(slug);
