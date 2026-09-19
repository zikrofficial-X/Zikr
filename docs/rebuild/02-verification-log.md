# ZIKR Rebuild Verification Log

Date: 2026-09-19
Rebuild branch: `rebuild/clean-foundation-v2`
Frozen main baseline: `36d051902c9be10e2082648ee1970c54b99ff10f`

## Completed in this pass

- Restored feature implementations that were referenced by the new architecture but absent from the branch:
  - `src/features/media/services/cloudinary-validation.ts`
  - `src/features/media/services/cloudinary.ts`
  - `src/features/social/services/native-social-sync.ts`
  - `src/features/social/services/social-publishing.ts`
  - `src/features/audio/services/radio.ts`
  - `src/features/spiritual-ai/services/ai.ts`
  - `src/features/videos/services/video-automation.ts`
  - `src/features/videos/integrations/youtube.ts`
- Corrected verification scripts that were still checking the pre-rebuild `app/`, `components/`, and `lib/` layout:
  - `verify-platform-routes.mjs`
  - `verify-offline-content.mjs`
  - `verify-mobile-readiness.mjs`
  - `verify-native-social-sync.mjs`
  - `verify-adsense-readiness.mjs`
  - `verify-google-search-console.mjs`
  - `verify-deployment-sync.mjs`
- Kept compatibility exports under `src/lib/services` temporarily while consumer/import cleanup remains in progress.

## Verified deployment evidence

The latest Vercel status attached to the rebuild branch is currently reporting a `build-rate-limit` failure. This is a platform build-capacity condition, not a code error.

The last Vercel deployment that actually ran `pnpm verify` reported:

`Command "pnpm verify" exited with 1`

The rebuild audit then identified deterministic structural causes behind that verification failure: missing feature targets and verification scripts pointing at the old directory layout. Those issues have been corrected on this branch.

CircleCI `ci/circleci: ci-check` is currently pending for the latest rebuild commit.

## Not yet certified

The project is **not** marked 100% verified yet. Final certification still requires a successful execution of:

1. Supabase migration validation/replay.
2. Local import, route, offline, hygiene, native-social, AdSense, and Search Console checks.
3. ESLint.
4. TypeScript `tsc --noEmit`.
5. Unit/integration tests.
6. Production Next.js build.
7. Runtime route smoke tests against the resulting deployment.
8. Final Supabase/RLS/security audit.
9. Remaining content-library consolidation and content quality review.
10. Final branch gate confirming `main` is still exactly `36d051902c9be10e2082648ee1970c54b99ff10f`.

## Safety rule

No production Supabase object is deleted as part of this rebuild. No changes are merged into `main` from this branch during the rebuild phase.


## Latest pass — 2026-09-19

- Unified reciter pages with `features/quran/services/quran` instead of importing the static fallback directly.
- Moved curated poetry data to `src/features/poetry/data/fallback.ts`; the route now consumes the feature data.
- Made the tafsir library database-driven through `getTafsirSourcesFromDb()` and moved its client UI under `features/quran/components`.
- Centralized the tafsir source type under `features/quran/types` so the client layer does not import server-only modules.
- Repaired a corrupted Arabic fallback character in the prophets data and a corrupted Arabic word in the poetry page.
- Corrected the Quran ayah-page tafsir fallback metadata so its source/author match the edition used by the service.
- Verified the live Supabase migration ledger: 230 remote versions == 230 local migration files; no remote-only or local-only versions and no duplicate local version IDs.
- Verified all public-schema tables observed in the audit have RLS enabled.
- Verified no `SECURITY DEFINER` function is currently EXECUTE-granted to `anon` or `authenticated`; no public-schema views were found.
- Supabase security advisor currently reports one warning: leaked-password protection is disabled. This is an Auth project setting and has not been changed through SQL.
- Supabase performance advisor reports unused indexes; these are informational and were not deleted blindly.
- Live content audit: `content_library` currently has no published rows; 177 drafts and 2 editorial-review rows remain unpublished. Published prophet rows exist separately, including legacy sections whose text quality still requires editorial review.
- The branch is not certified until the actual CI/build chain passes: migration replay, imports, routes, hygiene, lint, TypeScript, tests, production build, runtime smoke tests, and final security/content gates.
