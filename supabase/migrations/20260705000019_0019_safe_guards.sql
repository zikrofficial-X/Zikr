-- Migration: 20260705_0019_safe_guards.sql
-- Purpose: Add guarded type creations, conditional columns, indexes and foreign keys to avoid failures
-- Generated: 2026-07-05

-- Guarded ENUM types (safe to re-run)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE public.role AS ENUM ('user','admin');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category') THEN
    CREATE TYPE public.category AS ENUM('dark','romantic','psychological');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM('pending','approved','rejected');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan') THEN
    CREATE TYPE public.plan AS ENUM('free','pro','premium');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
    CREATE TYPE public.status AS ENUM('pending','completed','failed');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Types created in other migrations but ensure existence
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'favorite_item_type') THEN
    CREATE TYPE public.favorite_item_type AS ENUM('quran','hadith','story','scholar','dua');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_scope') THEN
    CREATE TYPE public.progress_scope AS ENUM('quran','hadith','stories');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_type') THEN
    CREATE TYPE public.reminder_type AS ENUM('prayer','quran','adhkar','fasting','zakat');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add missing columns if absent (non-destructive)
ALTER TABLE IF EXISTS public.stories ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE IF EXISTS public.stories ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.scholars ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add indexes if missing (guarded: only if the target table/column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quran_audio') THEN
    CREATE INDEX IF NOT EXISTS idx_quran_audio_surah ON public.quran_audio(surah_id);
    CREATE INDEX IF NOT EXISTS idx_quran_audio_reciter ON public.quran_audio(reciter_id);
  END IF;
END$$;

-- Ensure the generated full-text column exists before indexing it. On databases
-- where quran_ayahs pre-existed without it, the bare CREATE INDEX previously
-- failed with: column "searchable" does not exist (SQLSTATE 42703).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quran_ayahs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='quran_ayahs' AND column_name='searchable'
    ) THEN
      ALTER TABLE public.quran_ayahs
        ADD COLUMN searchable tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(text_uthmani,'') || ' ' || coalesce(text_simple,''))) STORED;
    END IF;
    CREATE INDEX IF NOT EXISTS quran_ayahs_search_idx ON public.quran_ayahs USING gin (searchable);
  END IF;
END$$;

-- Create unique indexes conditionally using plpgsql (some unique constraints were added in multiple migrations)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname = 'favorites_user_item_unique' AND n.nspname='public') THEN
    CREATE UNIQUE INDEX favorites_user_item_unique ON public.favorites(user_id, item_type, item_ref);
  END IF;
EXCEPTION WHEN others THEN
  -- ignore and continue
  RAISE NOTICE 'favorites_user_item_unique creation skipped: %', SQLERRM;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname = 'reading_progress_user_scope_ref_unique' AND n.nspname='public') THEN
    CREATE UNIQUE INDEX reading_progress_user_scope_ref_unique ON public.reading_progress(user_id, scope, ref);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'reading_progress_user_scope_ref_unique creation skipped: %', SQLERRM;
END$$;

-- Add foreign key constraints only if missing (non-destructive)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='story_reads') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_reads_story_id_fkey') THEN
    ALTER TABLE public.story_reads
      ADD CONSTRAINT story_reads_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='story_ratings') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_ratings_story_id_fkey') THEN
    ALTER TABLE public.story_ratings
      ADD CONSTRAINT story_ratings_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='story_favorites') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'story_favorites_story_id_fkey') THEN
    ALTER TABLE public.story_favorites
      ADD CONSTRAINT story_favorites_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
  END IF;

  -- favorites -> profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='favorites') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorites_user_id_profiles_id_fk') THEN
    BEGIN
      ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_profiles_id_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add favorites_user_id_profiles_id_fk: %', SQLERRM;
    END;
  END IF;
END$$;

-- RLS policies: ensure critical policies exist (non-destructive create if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own' AND tablename = 'profiles') THEN
    CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'favorites_owner_all' AND tablename = 'favorites') THEN
    CREATE POLICY "favorites_owner_all" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Safety note: This migration avoids any DROP TABLE or destructive ALTER statements.
-- If you need destructive operations (DROP TABLE / DROP CONSTRAINT), they must be executed in a controlled maintenance window and after a verified backup.
