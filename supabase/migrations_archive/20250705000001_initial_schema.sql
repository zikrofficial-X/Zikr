-- =============================================================================
-- Migration: 20250705000001_initial_schema
-- Description: Full initial schema derived from drizzle/schema.ts.
--              The remote database has zero custom tables and zero migration
--              history, so this creates everything from scratch.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE favorite_item_type AS ENUM ('quran', 'hadith', 'story', 'scholar', 'dua');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE progress_scope AS ENUM ('quran', 'hadith', 'stories');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reminder_type AS ENUM ('prayer', 'quran', 'adhkar', 'fasting', 'zakat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE category AS ENUM ('dark', 'romantic', 'psychological');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan AS ENUM ('free', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 3. Base / lookup tables (no FK dependencies on custom tables)
-- ---------------------------------------------------------------------------

-- profiles (references auth.users via RLS, but no FK constraint by default)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                uuid PRIMARY KEY,
  display_name      text,
  avatar_url        text,
  locale            text NOT NULL DEFAULT 'ar',
  role              role NOT NULL DEFAULT 'user',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- legacy users table (for backward compat with older code)
CREATE TABLE IF NOT EXISTS public.users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "openId"        text UNIQUE,
  name            text,
  email           text UNIQUE,
  "loginMethod"   text,
  role            role NOT NULL DEFAULT 'user',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  last_signed_in  timestamptz NOT NULL DEFAULT now()
);

-- site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  value      jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- competitions
CREATE TABLE IF NOT EXISTS public.competitions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  prize       text,
  starts_at   timestamptz,
  ends_at     timestamptz,
  published   boolean NOT NULL DEFAULT false,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- pinned_messages
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title      text,
  body       text,
  type       text,
  is_active  boolean NOT NULL DEFAULT true,
  start_at   timestamptz,
  end_at     timestamptz,
  priority   integer NOT NULL DEFAULT 0
);

-- memorization_plans
CREATE TABLE IF NOT EXISTS public.memorization_plans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  cadence      text NOT NULL DEFAULT 'daily',
  target_ref   text,
  prompt       text,
  tajweed_focus text,
  published    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  email                 text NOT NULL,
  subject               text NOT NULL,
  message               text NOT NULL,
  language              text NOT NULL DEFAULT 'en',
  read                  boolean NOT NULL DEFAULT false,
  "notificationSent"    boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- subscriptions (newsletter)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                text NOT NULL UNIQUE,
  language             text NOT NULL DEFAULT 'en',
  verified             boolean NOT NULL DEFAULT false,
  "verificationToken"  text,
  subscribed_at        timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at      timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- video_publishing_config
CREATE TABLE IF NOT EXISTS public.video_publishing_config (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_enabled     boolean NOT NULL DEFAULT false,
  youtube_channel_id  text,
  facebook_enabled    boolean NOT NULL DEFAULT false,
  facebook_page_id    text,
  auto_publish        boolean NOT NULL DEFAULT false,
  publish_schedule    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. Quran content tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quran_surahs (
  id                  integer PRIMARY KEY,
  name_ar             text NOT NULL,
  name_en             text NOT NULL,
  name_translation    text,
  revelation_place    text,
  ayahs_count         integer NOT NULL,
  "order"             integer NOT NULL,
  slug                text NOT NULL UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quran_reciters (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar              text NOT NULL,
  name_en              text NOT NULL,
  code                 text NOT NULL UNIQUE,
  style                text,
  base_url_template    text NOT NULL,
  thumbnail_url        text,
  metadata             jsonb DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quran_ayahs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_id     integer NOT NULL REFERENCES public.quran_surahs(id) ON DELETE CASCADE,
  ayah_number  integer NOT NULL,
  text_ar      text NOT NULL,
  text_en      text,
  audio_url    text,
  text_uthmani text,
  text_simple  text,
  page         integer,
  juz          integer,
  hizb         integer,
  rub          integer,
  sajda        boolean DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (surah_id, ayah_number)
);

CREATE TABLE IF NOT EXISTS public.quran_tafsir (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_id     integer NOT NULL REFERENCES public.quran_surahs(id) ON DELETE CASCADE,
  ayah_number  integer NOT NULL,
  tafsir_ar    text NOT NULL,
  tafsir_en    text,
  author       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (surah_id, ayah_number, author)
);

CREATE TABLE IF NOT EXISTS public.quran_audio (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_id    integer NOT NULL REFERENCES public.quran_surahs(id),
  reciter_id  uuid NOT NULL REFERENCES public.quran_reciters(id),
  audio_url   text NOT NULL,
  duration    integer
);

-- ---------------------------------------------------------------------------
-- 5. Hadith tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hadith_books (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL UNIQUE,
  name_ar      text NOT NULL,
  name_en      text NOT NULL,
  source       text NOT NULL,
  author_ar    text,
  author_en    text,
  hadith_count integer,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hadiths (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id       uuid NOT NULL REFERENCES public.hadith_books(id) ON DELETE CASCADE,
  hadith_number text NOT NULL,
  text_ar       text NOT NULL,
  text_en       text,
  narrator_ar   text,
  narrator_en   text,
  grade_ar      text,
  grade_en      text,
  chapter       text,
  ref           text,
  published     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, hadith_number)
);

CREATE TABLE IF NOT EXISTS public.hadith_explanations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hadith_id       uuid NOT NULL REFERENCES public.hadiths(id) ON DELETE CASCADE,
  explanation_ar  text NOT NULL,
  explanation_en  text,
  author          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. Scholars & Stories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.scholars (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar       text NOT NULL,
  name_en       text NOT NULL,
  slug          text NOT NULL UNIQUE,
  bio_ar        text,
  bio_en        text,
  thumbnail_url text,
  website_url   text,
  youtube_url   text,
  published     boolean NOT NULL DEFAULT true,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  user_id    uuid,
  title      text NOT NULL,
  summary    text,
  content    text NOT NULL,
  mood       text,
  category   text NOT NULL,
  published  boolean DEFAULT true,
  metadata   jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. Prophets
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.prophets (
  id                   uuid PRIMARY KEY,
  name_ar              text NOT NULL,
  name_en              text NOT NULL,
  slug                 text NOT NULL UNIQUE,
  bio_ar               text,
  bio_en               text,
  birth_place_ar       text,
  death_place_ar       text,
  featured_image_url   text,
  thumbnail_url        text,
  order_num            integer NOT NULL DEFAULT 0,
  published            boolean NOT NULL DEFAULT true,
  metadata             jsonb NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prophet_sections (
  id           uuid PRIMARY KEY,
  prophet_id   uuid NOT NULL REFERENCES public.prophets(id) ON DELETE CASCADE,
  title_ar     text NOT NULL,
  title_en     text,
  content_ar   text NOT NULL,
  content_en   text,
  section_type text,
  order_num    integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 8. Duas
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.dua_categories (
  id         uuid PRIMARY KEY,
  name_ar    text NOT NULL,
  name_en    text NOT NULL,
  slug       text NOT NULL UNIQUE,
  icon       text,
  published  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.duas (
  id             uuid PRIMARY KEY,
  title_ar       text NOT NULL,
  title_en       text NOT NULL,
  slug           text NOT NULL UNIQUE,
  text_ar        text NOT NULL,
  text_en        text,
  occasion_ar    text,
  occasion_en    text,
  source_ar      text,
  source_en      text,
  benefits_ar    text,
  benefits_en    text,
  category_id    uuid REFERENCES public.dua_categories(id) ON DELETE SET NULL,
  published      boolean NOT NULL DEFAULT true,
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 9. Article & Video content
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.article_categories (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar        text NOT NULL,
  name_en        text NOT NULL,
  slug           text NOT NULL UNIQUE,
  description_ar text,
  description_en text,
  icon           text,
  published      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.articles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id        uuid REFERENCES public.article_categories(id) ON DELETE CASCADE,
  title              text NOT NULL,
  slug               text NOT NULL UNIQUE,
  content            text NOT NULL,
  summary            text,
  author             text,
  tags               text[] DEFAULT '{}',
  featured_image_url text,
  published          boolean NOT NULL DEFAULT true,
  views              integer NOT NULL DEFAULT 0,
  metadata           jsonb DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_categories (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar        text NOT NULL,
  name_en        text NOT NULL,
  slug           text NOT NULL UNIQUE,
  description_ar text,
  description_en text,
  icon           text,
  published      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.videos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   uuid REFERENCES public.video_categories(id) ON DELETE CASCADE,
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  youtube_id    text,
  thumbnail_url text,
  duration      integer,
  views         integer NOT NULL DEFAULT 0,
  published     boolean NOT NULL DEFAULT true,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_generation_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  category      text NOT NULL,
  content       jsonb NOT NULL,
  duration      integer,
  thumbnail_url text,
  status        text NOT NULL DEFAULT 'pending',
  youtube_id    text,
  facebook_id   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 10. Kids content
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.kids_content (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar           text NOT NULL,
  title_en           text NOT NULL,
  slug               text NOT NULL UNIQUE,
  type               text NOT NULL,
  content_ar         text,
  content_en         text,
  age_group          text NOT NULL,
  featured_image_url text,
  video_url          text,
  quiz_data          jsonb,
  published          boolean NOT NULL DEFAULT true,
  metadata           jsonb DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 11. Companions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.companions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar            text NOT NULL,
  name_en            text NOT NULL,
  slug               text NOT NULL UNIQUE,
  bio_ar             text,
  bio_en             text,
  category           text,
  thumbnail_url      text,
  featured_image_url text,
  order_num          integer,
  published          boolean NOT NULL DEFAULT true,
  metadata           jsonb DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.companion_stories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  title_ar     text NOT NULL,
  title_en     text NOT NULL,
  content_ar   text NOT NULL,
  content_en   text,
  story_type   text,
  order_num    integer,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 12. Battles & Conquests
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.battles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar            text NOT NULL,
  name_en            text NOT NULL,
  slug               text NOT NULL UNIQUE,
  description_ar     text,
  description_en     text,
  date_hijri         text,
  date_gregorian     text,
  location_ar        text,
  location_en        text,
  thumbnail_url      text,
  featured_image_url text,
  order_num          integer,
  published          boolean NOT NULL DEFAULT true,
  metadata           jsonb DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.battle_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id    uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  title_ar     text NOT NULL,
  title_en     text NOT NULL,
  content_ar   text NOT NULL,
  content_en   text,
  event_type   text,
  order_num    integer,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conquests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar            text NOT NULL,
  name_en            text NOT NULL,
  slug               text NOT NULL UNIQUE,
  description_ar     text,
  description_en     text,
  date_hijri         text,
  date_gregorian     text,
  location_ar        text,
  location_en        text,
  leader_ar          text,
  leader_en          text,
  thumbnail_url      text,
  featured_image_url text,
  order_num          integer,
  published          boolean NOT NULL DEFAULT true,
  metadata           jsonb DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conquest_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conquest_id  uuid NOT NULL REFERENCES public.conquests(id) ON DELETE CASCADE,
  title_ar     text NOT NULL,
  title_en     text NOT NULL,
  content_ar   text NOT NULL,
  content_en   text,
  event_type   text,
  order_num    integer,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 13. Tawasheeh
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tawasheeh_categories (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar        text NOT NULL,
  name_en        text NOT NULL,
  slug           text NOT NULL UNIQUE,
  description_ar text,
  description_en text,
  icon           text,
  order_num      integer,
  published      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tawasheeh (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar      text NOT NULL,
  title_en      text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description_ar text,
  description_en text,
  artist_ar     text,
  artist_en     text,
  category_id   uuid REFERENCES public.tawasheeh_categories(id) ON DELETE SET NULL,
  audio_url     text,
  thumbnail_url text,
  duration      integer,
  views         integer NOT NULL DEFAULT 0,
  published     boolean NOT NULL DEFAULT true,
  featured      boolean NOT NULL DEFAULT false,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 14. Episodes (YouTube / podcast)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.episodes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL UNIQUE,
  "titleEn"        text NOT NULL,
  "titleAr"        text NOT NULL,
  "descriptionEn"  text NOT NULL,
  "descriptionAr"  text NOT NULL,
  "contentEn"      text NOT NULL,
  "contentAr"      text NOT NULL,
  "keywordsEn"     text,
  "keywordsAr"     text,
  category         text,
  "thumbnailUrl"   text,
  "youtubeVideoId" text,
  published_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 15. User-owned tables (reference profiles)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.favorites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type  favorite_item_type NOT NULL,
  item_ref   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_item_unique ON public.favorites (user_id, item_type, item_ref);

CREATE TABLE IF NOT EXISTS public.reading_progress (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scope         progress_scope NOT NULL,
  ref           text NOT NULL,
  progress_json jsonb NOT NULL DEFAULT '{}',
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS reading_progress_user_scope_ref_unique ON public.reading_progress (user_id, scope, ref);

CREATE TABLE IF NOT EXISTS public.reminders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          reminder_type NOT NULL,
  schedule_json jsonb NOT NULL DEFAULT '{}',
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quran_favorites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  surah_id   integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, surah_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  item_type  text NOT NULL,
  item_ref   text NOT NULL,
  label      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.search_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  query       text NOT NULL,
  searched_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quran_reads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  surah_id    integer NOT NULL,
  ayah_number integer NOT NULL,
  read_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.story_reads (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid NOT NULL,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  read_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.story_ratings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  story_id   uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  rating     smallint NOT NULL,
  comment    text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.story_favorites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  story_id   uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.social_shares (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  content_type text NOT NULL,
  content_id   text NOT NULL,
  platform     text,
  shared_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prophet_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  prophet_id  text NOT NULL,
  note        text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, prophet_id)
);

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL,
  "emailNotifications"  boolean NOT NULL DEFAULT true,
  "pushNotifications"   boolean NOT NULL DEFAULT true,
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.adhkar_completions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  adhkar_id    text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.adhkar_streaks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  streak            integer NOT NULL DEFAULT 0,
  last_completed_at timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  theme       text NOT NULL DEFAULT 'system',
  "fontSize"  text NOT NULL DEFAULT 'medium',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  title      text NOT NULL,
  body       text,
  type       text,
  read       boolean NOT NULL DEFAULT false,
  metadata   jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 16. Subscription & Payments (reference profiles)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.profiles(id),
  plan       plan NOT NULL DEFAULT 'free',
  credits    integer NOT NULL DEFAULT 20,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid,
  amount          integer NOT NULL,
  method          text NOT NULL,
  reference_note  text NOT NULL,
  screenshot_url  text,
  status          payment_status NOT NULL DEFAULT 'pending',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 17. Research
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.research_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid,
  title      text NOT NULL,
  field      text NOT NULL,
  pages      integer NOT NULL DEFAULT 3,
  type       text NOT NULL,
  language   text NOT NULL DEFAULT 'en',
  status     status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.generated_research (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid REFERENCES public.research_requests(id),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 18. Prayer tables (reference profiles)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.prayer_locations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city       text NOT NULL,
  country    text,
  latitude   numeric,
  longitude  numeric,
  timezone   text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prayer_preferences (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  calculation_method    text DEFAULT 'umm-al-qura',
  madhab                text DEFAULT 'shafi',
  high_latitude_method  text DEFAULT 'middle-of-night',
  asr_method            text DEFAULT 'shafi',
  midnight_method       text DEFAULT 'standard',
  notifications_enabled boolean NOT NULL DEFAULT true,
  adhan_enabled         boolean NOT NULL DEFAULT true,
  adhan_volume          integer NOT NULL DEFAULT 70,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prayer_notifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prayer_name       text NOT NULL,
  notification_time timestamptz NOT NULL,
  sent_at           timestamptz,
  status            text DEFAULT 'pending',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 19. Tawasheeh user tables (reference profiles)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tawasheeh_favorites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tawasheeh_id  uuid NOT NULL REFERENCES public.tawasheeh(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tawasheeh_playlists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  is_public   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tawasheeh_playlist_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id   uuid NOT NULL REFERENCES public.tawasheeh_playlists(id) ON DELETE CASCADE,
  tawasheeh_id  uuid NOT NULL REFERENCES public.tawasheeh(id) ON DELETE CASCADE,
  order_num     integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 20. Reciter user tables (reference profiles / quran_reciters)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reciter_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reciter_id  uuid NOT NULL REFERENCES public.quran_reciters(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recent_recitations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reciter_id         uuid NOT NULL REFERENCES public.quran_reciters(id) ON DELETE CASCADE,
  surah_id           integer NOT NULL,
  ayah_number        integer,
  played_at          timestamptz NOT NULL DEFAULT now(),
  duration_listened  integer,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 21. Legacy / misc user tables (reference legacy users table)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.saved_stories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id),
  story_id   uuid NOT NULL REFERENCES public.stories(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.story_progress (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id),
  story_id   uuid NOT NULL REFERENCES public.stories(id),
  progress   integer NOT NULL DEFAULT 0,
  completed  boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id),
  input      text NOT NULL,
  result     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_behavior (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES public.users(id),
  page         text NOT NULL,
  time_spent   integer NOT NULL DEFAULT 0,
  interaction  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 22. Additional indexes for performance
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_quran_ayahs_surah ON public.quran_ayahs(surah_id);
CREATE INDEX IF NOT EXISTS idx_hadiths_book ON public.hadiths(book_id);
CREATE INDEX IF NOT EXISTS idx_stories_slug ON public.stories(slug);
CREATE INDEX IF NOT EXISTS idx_stories_category ON public.stories(category);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_slug ON public.videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos(category_id);
CREATE INDEX IF NOT EXISTS idx_scholars_slug ON public.scholars(slug);
CREATE INDEX IF NOT EXISTS idx_companions_slug ON public.companions(slug);
CREATE INDEX IF NOT EXISTS idx_prophets_slug ON public.prophets(slug);
CREATE INDEX IF NOT EXISTS idx_duas_slug ON public.duas(slug);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_quran_reads_user ON public.quran_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_recitations_user ON public.recent_recitations(user_id);
CREATE INDEX IF NOT EXISTS idx_tawasheeh_slug ON public.tawasheeh(slug);
