-- Migration: Seed real Islamic content into empty content tables
-- Generated: 2024-07-05
-- Archived: retained for historical reference only.
--
-- The original archived seed file contained truncated placeholder text
-- that was not valid SQL. It has been converted into a safe no-op so archive
-- replays and repository-wide SQL validation do not fail. Current seed/content
-- data is managed by the active migrations and application content workflows.

DO $$
BEGIN
  RAISE NOTICE 'Archived seed_content migration is a no-op; active migrations manage current content.';
END $$;
