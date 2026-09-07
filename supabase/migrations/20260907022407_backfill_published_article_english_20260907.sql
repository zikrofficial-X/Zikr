-- Migration-history reconciliation marker.
-- Production applied this change under version 20260907022407 before the
-- migration file was committed to Git. The full, idempotent data backfill is
-- retained in 20260907050000_backfill_published_article_english_20260907.sql.
-- Keeping the production version present in Git makes the Supabase Preview
-- migration chain match the production migration ledger.
select 1;
