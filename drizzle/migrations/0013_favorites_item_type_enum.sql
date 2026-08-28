-- Migration 0013: Convert favorites.item_type from plain text to the
-- favorite_item_type enum so it aligns with drizzle/schema.ts.
-- Safe to run multiple times (all steps are idempotent).

-- 1. Create the enum type if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'favorite_item_type') THEN
    CREATE TYPE favorite_item_type AS ENUM (
      'quran',
      'hadith',
      'story',
      'scholar',
      'dua'
    );
  END IF;
END
$$;

-- 2. Add any missing values to the enum (no-op if already present)
DO $$
BEGIN
  -- quran
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'favorite_item_type'::regtype AND enumlabel = 'quran'
  ) THEN ALTER TYPE favorite_item_type ADD VALUE 'quran'; END IF;

  -- hadith
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'favorite_item_type'::regtype AND enumlabel = 'hadith'
  ) THEN ALTER TYPE favorite_item_type ADD VALUE 'hadith'; END IF;

  -- story
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'favorite_item_type'::regtype AND enumlabel = 'story'
  ) THEN ALTER TYPE favorite_item_type ADD VALUE 'story'; END IF;

  -- scholar
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'favorite_item_type'::regtype AND enumlabel = 'scholar'
  ) THEN ALTER TYPE favorite_item_type ADD VALUE 'scholar'; END IF;

  -- dua
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'favorite_item_type'::regtype AND enumlabel = 'dua'
  ) THEN ALTER TYPE favorite_item_type ADD VALUE 'dua'; END IF;
END
$$;

-- 3. Only alter the column if it is still plain text (skip if already enum)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'favorites'
      AND column_name = 'item_type'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE favorites
      ALTER COLUMN item_type TYPE favorite_item_type
      USING item_type::favorite_item_type;
  END IF;
END
$$;
