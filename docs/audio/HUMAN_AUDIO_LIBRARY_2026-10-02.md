# ZIKR Human Audio Library — 2026-10-02

## Catalogue target

The production site-audio catalogue now contains **10 entries in each section**:

- Adhan: 10
- Salawat / ذكر النبي ﷺ: 10
- Dhikr / Tasbih: 10

The first 7 entries already existed in the curated catalogue. This expansion adds 23 new Cloudinary assets and their Supabase/GitHub metadata.

## Storage architecture

- **Cloudinary:** audio/media binaries and delivery URLs.
- **GitHub:** canonical curated catalogue, source/license metadata, Supabase migration.
- **Supabase:** `site_audio_assets` playback catalogue and `media_assets` rights-verified media records.

## Rights policy

Only sources with explicit reuse status on Wikimedia Commons were added to the new expansion: public-domain material or Creative Commons licensed recordings. Where a source is a short pronunciation/voice clip rather than a long-form recitation, the UI title describes it honestly.

Modern copyrighted recitations without a clear redistribution license were not mirrored into the production library.

## Notable adhan sources

- Sabah Fakhri — Commons file marked public domain.
- Hassan II Mosque recording — CC BY-SA 4.0.
- Aaqib Azeez — CC BY-SA 4.0.
- Shalqar Mosque — CC BY-SA 4.0.
- Great Mosque of Mecca recordings (2012/2013) — CC BY 3.0.
- Shah Mosque, Isfahan — CC BY 3.0.

## Files changed

- `src/lib/audio/curated-library.ts`
- `supabase/migrations/20261002174500_human_audio_library_expansion_20261002.sql`

## Verification

Supabase verification after migration:

- `adhan = 10`
- `salawat = 10`
- `dhikr = 10`
- exactly one primary asset per section

