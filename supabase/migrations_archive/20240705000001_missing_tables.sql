-- Migration: Create missing tables referenced by server actions
-- Generated: 2024-07-05

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. quran_favorites
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quran_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_id    INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, surah_id)
);
CREATE INDEX IF NOT EXISTS quran_favorites_user_id_idx ON public.quran_favorites (user_id);
ALTER TABLE public.quran_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quran_favorites: users own their rows"
  ON public.quran_favorites
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. bookmarks
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL,
  item_ref    TEXT NOT NULL,
  label       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks (user_id);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks: users own their rows"
  ON public.bookmarks
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. search_history
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.search_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query        TEXT NOT NULL,
  searched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON public.search_history (user_id);
CREATE INDEX IF NOT EXISTS search_history_searched_at_idx ON public.search_history (searched_at DESC);
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_history: users own their rows"
  ON public.search_history
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. story_reads
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_reads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id    UUID NOT NULL,
  read_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, story_id)
);
CREATE INDEX IF NOT EXISTS story_reads_user_id_idx ON public.story_reads (user_id);
ALTER TABLE public.story_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_reads: users own their rows"
  ON public.story_reads
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. story_ratings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id    UUID NOT NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, story_id)
);
CREATE INDEX IF NOT EXISTS story_ratings_story_id_idx ON public.story_ratings (story_id);
ALTER TABLE public.story_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_ratings: users own their rows"
  ON public.story_ratings
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. story_favorites
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.story_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id    UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, story_id)
);
CREATE INDEX IF NOT EXISTS story_favorites_user_id_idx ON public.story_favorites (user_id);
ALTER TABLE public.story_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_favorites: users own their rows"
  ON public.story_favorites
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. social_shares
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_shares (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id   TEXT NOT NULL,
  platform     TEXT,
  shared_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS social_shares_user_id_idx ON public.social_shares (user_id);
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_shares: users own their rows"
  ON public.social_shares
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. quran_reads
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quran_reads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_id     INTEGER NOT NULL,
  ayah_number  INTEGER NOT NULL,
  read_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quran_reads_user_id_idx ON public.quran_reads (user_id);
CREATE INDEX IF NOT EXISTS quran_reads_read_at_idx  ON public.quran_reads (read_at DESC);
ALTER TABLE public.quran_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quran_reads: users own their rows"
  ON public.quran_reads
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. prophet_notes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prophet_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prophet_id  TEXT NOT NULL,
  note        TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, prophet_id)
);
CREATE INDEX IF NOT EXISTS prophet_notes_user_id_idx ON public.prophet_notes (user_id);
ALTER TABLE public.prophet_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prophet_notes: users own their rows"
  ON public.prophet_notes
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. notification_settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "emailNotifications"  BOOLEAN NOT NULL DEFAULT true,
  "pushNotifications"   BOOLEAN NOT NULL DEFAULT true,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON public.notification_settings (user_id);
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_settings: users own their rows"
  ON public.notification_settings
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. adhkar_completions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.adhkar_completions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adhkar_id     TEXT NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS adhkar_completions_user_id_idx ON public.adhkar_completions (user_id);
ALTER TABLE public.adhkar_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adhkar_completions: users own their rows"
  ON public.adhkar_completions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. adhkar_streaks
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.adhkar_streaks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak              INTEGER NOT NULL DEFAULT 0,
  last_completed_at   TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS adhkar_streaks_user_id_idx ON public.adhkar_streaks (user_id);
ALTER TABLE public.adhkar_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adhkar_streaks: users own their rows"
  ON public.adhkar_streaks
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. app_settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme       TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  "fontSize"  TEXT NOT NULL DEFAULT 'medium' CHECK ("fontSize" IN ('small','medium','large')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
CREATE INDEX IF NOT EXISTS app_settings_user_id_idx ON public.app_settings (user_id);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings: users own their rows"
  ON public.app_settings
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. Foreign keys to public.stories (added conditionally so this migration is
--     order-independent: the FK is only created once the stories table exists).
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stories'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_reads_story_id_fkey') THEN
      ALTER TABLE public.story_reads
        ADD CONSTRAINT story_reads_story_id_fkey
        FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_ratings_story_id_fkey') THEN
      ALTER TABLE public.story_ratings
        ADD CONSTRAINT story_ratings_story_id_fkey
        FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_favorites_story_id_fkey') THEN
      ALTER TABLE public.story_favorites
        ADD CONSTRAINT story_favorites_story_id_fkey
        FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
