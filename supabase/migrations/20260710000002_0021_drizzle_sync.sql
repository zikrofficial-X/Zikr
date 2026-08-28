-- Migration 0021: Drizzle ↔ Supabase full sync
-- Adds every column present in drizzle/schema.ts that may be missing
-- in the live database due to out-of-order or partial migrations.
-- All statements are idempotent (IF NOT EXISTS / IF NOT EXISTS on index).

-- ─────────────────────────────────────────────────────────────────────────────
-- is_active column on category / content tables (added by migration 0019)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.article_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.dua_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.kids_content
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.tawasheeh
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.tawasheeh_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.video_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ─────────────────────────────────────────────────────────────────────────────
-- quran_ayahs: text_uthmani & text_simple (added by migration 0019 FTS)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.quran_ayahs
  ADD COLUMN IF NOT EXISTS text_uthmani TEXT;

ALTER TABLE public.quran_ayahs
  ADD COLUMN IF NOT EXISTS text_simple TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- video_generation_requests: error columns (added by migration 0021)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.video_generation_requests
  ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE public.video_generation_requests
  ADD COLUMN IF NOT EXISTS error_details TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- hadith_books / hadith_explanations: timestamps (added by migration 0018)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.hadith_books
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.hadith_books
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.hadith_explanations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.hadith_explanations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────────────────────
-- hadiths: published flag & timestamps (added by migration 0018)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.hadiths
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.hadiths
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.hadiths
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: ensure email column exists (referenced by auth trigger)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- favorites: FK constraint (idempotent via DO block)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'favorites_user_id_profiles_id_fk'
      AND table_name = 'favorites'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.favorites
      ADD CONSTRAINT favorites_user_id_profiles_id_fk
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FTS: searchable generated columns (safe to skip if already exist)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quran_ayahs'
      AND column_name = 'searchable'
  ) THEN
    ALTER TABLE public.quran_ayahs
      ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(text_uthmani, '') || ' ' || coalesce(text_simple, ''))
      ) STORED;
    CREATE INDEX IF NOT EXISTS quran_ayahs_searchable_idx
      ON public.quran_ayahs USING GIN (searchable);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hadiths'
      AND column_name = 'searchable'
  ) THEN
    ALTER TABLE public.hadiths
      ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(text_ar, '') || ' ' || coalesce(text_en, ''))
      ) STORED;
    CREATE INDEX IF NOT EXISTS hadiths_searchable_idx
      ON public.hadiths USING GIN (searchable);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'duas'
      AND column_name = 'searchable'
  ) THEN
    ALTER TABLE public.duas
      ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(text_ar, '') || ' ' || coalesce(title_ar, ''))
      ) STORED;
    CREATE INDEX IF NOT EXISTS duas_searchable_idx
      ON public.duas USING GIN (searchable);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'articles'
      AND column_name = 'searchable'
  ) THEN
    ALTER TABLE public.articles
      ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(title_ar, '') || ' ' || coalesce(content_ar, ''))
      ) STORED;
    CREATE INDEX IF NOT EXISTS articles_searchable_idx
      ON public.articles USING GIN (searchable);
  END IF;
END$$;
