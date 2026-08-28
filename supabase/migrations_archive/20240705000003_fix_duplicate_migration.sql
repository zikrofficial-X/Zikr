-- Migration: Fix duplicate migration key issue
-- Generated: 2024-07-05
-- Description: Safely repairs old Supabase migration metadata when that table exists.

DO $$
BEGIN
  IF to_regclass('supabase_migrations.schema_migrations') IS NOT NULL THEN
    DELETE FROM supabase_migrations.schema_migrations
    WHERE version = 20240705000001;
  END IF;
END $$;

-- Ensure the category enum type exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'category' AND typnamespace =
    (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    CREATE TYPE public.category AS ENUM (
      'faith',
      'prophets',
      'sahaba',
      'documentaries',
      'history'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('supabase_migrations.schema_migrations') IS NOT NULL THEN
    INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
    VALUES
      (20240705000001, 'create_category_type', 'CREATE TYPE public.category AS ENUM'),
      (20240705000002, 'seed_content', 'ARCHIVED NO-OP')
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
