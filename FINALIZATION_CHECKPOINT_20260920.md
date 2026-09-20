# ZIKR Finalization Checkpoint — 2026-09-20

## Branch
- Branch: `finalization-src-20260920`
- HEAD: `87823d3592aa9d0151323679606d1780ea190508`
- Ahead of `main`: 118 commits
- Behind `main`: 0 commits

## Source finalization completed in this pass
- Canonical Quran catalog extracted into `src/features/quran/components/quran-catalog-page.tsx`.
- `/quran` and `/mushaf` now reuse the same catalog component instead of importing a route as a page dependency.
- Removed the obsolete partial Quran catalog file `src/features/quran/data/quran-surahs.ts`.
- Quran surah API now uses the canonical server Quran service and the local 6236-ayah corpus before Supabase fallback.
- Quran audio API/player contract normalized around `audio_url` from internal storage.
- Quran reciter detail pages now use the canonical `QuranAudioPlayer` instead of constructing direct MP3 URLs.
- Removed duplicate filesystem imports in Hadith and Articles services.
- HTTP retry policy now retries only idempotent methods.
- Public Articles, Stories, Prophets, Companions, Duas, Hadith Books and Dua Categories routes now delegate to feature services.
- Prophets and Companions now use published DB data as primary with offline content as slug-based fallback.
- Fixed Companion mapping so story records retain `companion_id`.
- Added explicit Supabase-config guards to Prophet/Companion reads to avoid unnecessary failed requests.
- Fixed the Articles API type import that caused the inspected Vercel build to fail at the type/lint stage.

## Route inventory
- Page route files: 100
- API route files: 56
- No duplicate normalized page-route groups were found.
- `/duas` is intentionally a redirect alias to `/dua`, not a second implementation.

## Supabase static audit
- Migration files: 250
- Migration filenames are timestamped.
- No duplicate migration timestamp prefixes were found.
- Current Quran Storage migration is present in the branch.
- Live SQL verification is **BLOCKED** in this session because the connected Supabase project is not exposed to the available SQL tool with permission.

## Android / iOS audit
- Android application id: `com.zikr.app`
- Android release version: `1.0.0` / versionCode `53`
- Android compile/target SDK: 36
- iOS bundle id: `com.zikr.app`
- iOS version/build: `1.0.0` / `53`
- Capacitor runtime/plugins are on 7.x.
- The repository currently uses `@capacitor/cli` 8.5.1 with the 7.x runtime. Git history shows this was deliberately restored to the verified lock baseline, so it was not changed blindly during finalization.
- Native `cap sync`, Gradle release build, and Xcode archive have **not** been executed in this environment.

## Vercel build gate
- Last inspected branch deployment before the latest source fixes: commit `33f405e7ee4d1a35eb7815e6fb81b8424cf3ae5a`
- State: ERROR
- Error code: `lint_or_type_error`
- Error message: `Command "pnpm build" exited with 1`
- The failing deployment predates the final source fixes recorded after that commit.
- A newer Vercel deployment for current HEAD was not visible in the connected deployment list at checkpoint time; therefore the current HEAD is **not marked build-passed**.

## Release rule
This checkpoint is source-finalization-complete for the audited areas above, but the branch is not marked release-ready until:
1. current HEAD receives a successful Vercel build;
2. live Supabase SQL/RLS checks are executed with valid project permissions;
3. `cap sync` plus Android/iOS native release builds pass;
4. signed store artifacts are produced using the real release secrets/fingerprints.
