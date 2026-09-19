# Supabase Remote Migration Ledger

This file records migrations applied directly to the live ZIKR Supabase project during the 2026-09-19 cleanup/rebuild pass.

| Remote version | Name | Purpose |
|---|---|---|
| 20260919021149 | content_catalog_phase2_20260919 | Adds and normalizes content-category catalogues for articles, duas, videos and tawasheeh. |
| 20260919021225 | editorial_expansion_phase2b_20260919 | Adds the phase-2 original editorial article set. |
| 20260919021236 | story_expansion_phase2_20260919 | Adds the original ethical-fiction story set with explicit fiction metadata. |
| 20260919021330 | kids_content_expansion_phase2d_20260919 | Adds the expanded family-friendly kids content set and publishes it safely. |
| 20260919021452 | cleanup_subscription_legacy_column_20260919 | Removes the unused legacy `verificationtoken` column after confirming zero rows used it. |

## Operational rules

- The live database is the source of truth for the remote migration ledger.
- Historical migration/archive files are not deleted merely to reduce file count; they are retained when they provide audit history.
- New runtime code must use canonical environment names and the current `src/` feature architecture.
- Content migrations must be idempotent where practical and must not fabricate Quran, hadith or historical attributions.
- When a future local migration replay is required, generate the SQL from a fresh schema/content snapshot rather than inventing historical migration bodies.

Last updated: 2026-09-19.
