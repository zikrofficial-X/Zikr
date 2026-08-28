-- Migration: safety fixes for quran_reciters, articles tags default, guarded updates, and story FK constraints
-- Created: 2026-07-05
-- Purpose: Make migrations idempotent and safe to run on existing databases by
--  1) cleaning duplicate quran_reciters.code values before creating a unique index
--  2) creating the unique index only when safe
--  3) ensuring articles.tags has a type-correct default
--  4) guarding UPDATEs that reference optional columns
--  5) adding story FK constraints only when stories table exists

BEGIN;

-- 1) Clean duplicate quran_reciters.code values (append short id suffix to duplicates)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quran_reciters' AND column_name = 'code'
  ) THEN
    WITH dup AS (
      SELECT id, code, row_number() OVER (PARTITION BY code ORDER BY id) rn
      FROM public.quran_reciters
    )
    UPDATE public.quran_reciters q
    SET code = q.code || '-' || substring(q.id::text, 1, 8)
    FROM dup
    WHERE q.id = dup.id AND dup.rn > 1;
  END IF;
END $$;

-- 1b) Create unique index on code if it does not exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quran_reciters' AND column_name = 'code'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('i','I') AND c.relname = 'quran_reciters_code_unique'
    ) THEN
      CREATE UNIQUE INDEX quran_reciters_code_unique ON public.quran_reciters(code);
    END IF;
  END IF;
END $$;

-- 2) Ensure articles.tags default is typed as text[] (if articles.tags exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'tags'
  ) THEN
    EXECUTE 'ALTER TABLE public.articles ALTER COLUMN tags SET DEFAULT ''{}''::text[]';
  END IF;
END $$;

-- 3) Guarded update for quran_ayahs.text_ar using existing optional columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quran_ayahs' AND column_name IN ('text_uthmani','text_simple')
  ) THEN
    EXECUTE 'UPDATE public.quran_ayahs SET text_ar = COALESCE(text_ar, text_uthmani, text_simple) WHERE text_ar IS NULL';
  END IF;
END $$;

-- 4) Ensure tafsir_ar is non-null-safe (fill blanks if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quran_tafsir' AND column_name = 'tafsir_ar'
  ) THEN
    EXECUTE 'UPDATE public.quran_tafsir SET tafsir_ar = COALESCE(tafsir_ar, '''') WHERE tafsir_ar IS NULL';
  END IF;
END $$;

-- 5) Add story foreign key constraints only when stories table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stories'
  ) THEN

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'story_reads'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_reads_story_id_fkey') THEN
        ALTER TABLE public.story_reads
          ADD CONSTRAINT story_reads_story_id_fkey
          FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'story_ratings'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_ratings_story_id_fkey') THEN
        ALTER TABLE public.story_ratings
          ADD CONSTRAINT story_ratings_story_id_fkey
          FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'story_favorites'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_favorites_story_id_fkey') THEN
        ALTER TABLE public.story_favorites
          ADD CONSTRAINT story_favorites_story_id_fkey
          FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
      END IF;
    END IF;

  END IF;
END $$;

COMMIT;
