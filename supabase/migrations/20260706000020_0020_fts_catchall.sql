-- Migration: 20260706000020_0020_fts_catchall.sql
-- Purpose: Definitive full-text search setup for all content tables.
--
-- This migration runs AFTER 0002 (which adds text_uthmani/text_simple to
-- quran_ayahs) and AFTER 0005/0010 (which attempt to add generated columns).
-- It guarantees the searchable column + GIN index exist regardless of which
-- migration path the database took (fresh install vs incremental upgrades).
--
-- All statements are fully idempotent via DO $$ guards.

-- 1. quran_ayahs: depends on text_uthmani + text_simple (added in 0002)
DO $$
BEGIN
  -- Ensure source columns exist (backfill if table came from 0001-only path)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'quran_ayahs'
  ) THEN
    -- Add text_uthmani if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'quran_ayahs' AND column_name = 'text_uthmani'
    ) THEN
      ALTER TABLE public.quran_ayahs ADD COLUMN text_uthmani text;
    END IF;

    -- Add text_simple if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'quran_ayahs' AND column_name = 'text_simple'
    ) THEN
      ALTER TABLE public.quran_ayahs ADD COLUMN text_simple text;
    END IF;

    -- Now add the generated tsvector column (requires source cols to exist)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'quran_ayahs' AND column_name = 'searchable'
    ) THEN
      ALTER TABLE public.quran_ayahs
        ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
          to_tsvector('simple', coalesce(text_uthmani, '') || ' ' || coalesce(text_simple, ''))
        ) STORED;
    END IF;

    -- Create GIN index if missing
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('i', 'I')
        AND c.relname = 'quran_ayahs_search_idx'
        AND n.nspname = 'public'
    ) THEN
      CREATE INDEX quran_ayahs_search_idx ON public.quran_ayahs USING gin (searchable);
    END IF;
  END IF;
END $$;

-- 2. hadiths: depends on text_ar (always present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'hadiths'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'hadiths' AND column_name = 'searchable'
    ) THEN
      ALTER TABLE public.hadiths
        ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
          to_tsvector('simple', coalesce(text_ar, ''))
        ) STORED;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('i', 'I')
        AND c.relname = 'hadiths_search_idx'
        AND n.nspname = 'public'
    ) THEN
      CREATE INDEX hadiths_search_idx ON public.hadiths USING gin (searchable);
    END IF;
  END IF;
END $$;

-- 3. duas: depends on title_ar + text_ar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'duas'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'duas' AND column_name = 'searchable'
    ) THEN
      ALTER TABLE public.duas
        ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
          to_tsvector('simple', coalesce(title_ar, '') || ' ' || coalesce(text_ar, ''))
        ) STORED;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('i', 'I')
        AND c.relname = 'duas_search_idx'
        AND n.nspname = 'public'
    ) THEN
      CREATE INDEX duas_search_idx ON public.duas USING gin (searchable);
    END IF;
  END IF;
END $$;

-- 4. articles: depends on title + content
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'articles'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'searchable'
    ) THEN
      ALTER TABLE public.articles
        ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
          to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
        ) STORED;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('i', 'I')
        AND c.relname = 'articles_search_idx'
        AND n.nspname = 'public'
    ) THEN
      CREATE INDEX articles_search_idx ON public.articles USING gin (searchable);
    END IF;
  END IF;
END $$;
