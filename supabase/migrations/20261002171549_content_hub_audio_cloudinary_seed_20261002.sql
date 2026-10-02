-- Supabase migration-history reconciliation marker.
-- Remote version 20261002171549 was already applied to the connected production
-- project as content_hub_audio_cloudinary_seed_20261002.
-- The canonical repository replay is carried by the later
-- 20261002173000_content_hub_audio_cloudinary_seed_20261002 migration.
-- Keep this version present so Supabase Preview can reconcile remote history
-- without replaying the historical production write a second time.
select 1;
