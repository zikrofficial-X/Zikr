# ZIKR Engineering Verification — 14 August 2026

## Actual status

ZIKR now builds successfully and the maintained automated verification pipeline passes after the repairs recorded below. The public deployment was checked directly: the homepage, Quran reader, core public routes, and unauthenticated protected-route redirects render correctly. The local prayer-times flow was reproduced from a first visit without cached data and then repaired and verified to render Cairo fallback timings.

> **Deployment qualification.** This repository is not yet fully deployment-verifiable from the current environment because the required Supabase publishable/anon key is not configured locally. This blocks authenticated end-to-end verification and anonymous REST/RLS smoke checks; it does not block the completed build, static, route, and browser checks.

| Area | Verified outcome | Qualification |
| --- | --- | --- |
| Dependency installation | `pnpm install --frozen-lockfile` completed | Passed |
| Static verification | Migration, required-route, local-import, mobile-readiness, lint, and TypeScript checks passed | Passed; mobile release IDs remain unset |
| Automated tests | 35 tests across 10 suites passed under an explicit `pnpm test` command | Route/module smoke coverage, not a substitute for authenticated E2E |
| Production build | Next.js optimized production build completed and generated 70 static pages | Passed |
| Public runtime | Homepage, Quran reader/audio metadata, and protected-route redirects checked on the public deployment | Passed |
| Prayer-times first visit | Empty-cache first visit no longer exits before requesting location/fallback data | Fixed and verified locally |
| Supabase database | Zikr project is active/healthy; discovered public tables have RLS enabled | Live migration history still differs from repository history |

## Critical issues found and fixed

### Prayer-times page could remain in an infinite first-visit loading state

The cache-restoration effect returned immediately when `zikr_prayer_location` was absent. This bypassed `requestLocation()` entirely, leaving `loading` true forever for first-time visitors. The effect now attempts cache restoration only when a cached value exists and **always** starts the geolocation/Cairo-fallback request afterward. A local browser run confirmed that the page transitions from the initial state to a full prayer schedule with next-prayer status and metadata.

### Public companions API unnecessarily used a service-role client

`/api/content/companions` used a privileged Supabase client for a public read despite the live database having `public_read_companions`, a policy limited to published entries. The route now uses the normal server client, allowing RLS to enforce the published-content boundary and reducing credential blast radius.

### Profile API queried protected columns and accepted unvalidated updates

The profile API used `select('*')` although the live database intentionally restricts authenticated access to profile columns; the pattern risks a permissions error when the protected email column is included. The handler now selects an explicit public/self-view profile projection, derives the response email only from the authenticated Supabase user, and validates JSON shape, display-name length, and supported locales. It also rejects empty update payloads and malformed JSON with actionable `400` responses.

### Test runner and test claims were not executable or accurate

The repository had no `test` script, direct Node execution could not load TypeScript, one prayer hook test referenced a non-existent path, and two tests used an unavailable Jest API with browser-relative requests despite no test server. A standard `pnpm test` command now runs the maintained TypeScript suite through `tsx`; stale test assumptions were replaced with clearly-labelled route-module smoke coverage. The aggregate `pnpm verify` command now includes the test suite.

### Production smoke test produced RLS false negatives

The smoke test treated successful anonymous requests to private automation tables as healthy. It now checks only public content tables with the anon key and explicitly verifies unauthenticated protected routes return redirect responses rather than silently following redirects to a login page.

## Important files changed

| File | Change |
| --- | --- |
| `app/prayer-times/page.tsx` | Fixed first-visit cache initialization so the location/fallback fetch always runs. |
| `app/api/content/companions/route.ts` | Replaced service-role content read with the normal RLS-respecting server client. |
| `app/api/user/profile/route.ts` | Added least-privilege select projection and strict update-payload validation. |
| `scripts/production-smoke-test.mjs` | Made protected-route and anonymous-RLS smoke checks security-aware. |
| `package.json` | Added `pnpm test`; added tests to `pnpm verify`. |
| `__tests__/integration/*.test.ts` | Repaired stale hook path and replaced unsupported Jest/browser-relative assumptions. |

## Database and RLS evidence

The accessible production ZIKR Supabase project is active and healthy. Its public tables reported RLS enabled, and the inspected policies confirmed owner-scoped policies for favorites, bookmarks, reading progress, notifications, user settings, and memorization progress. The companions table has a public-read policy restricted to `published = true`, which supports the route-level least-privilege change.

The live profile permissions also show that authenticated users can only update `display_name`, `avatar_url`, and `locale`; `role` and `email` are not writable through those grants. The profile API change aligns its projection with this column-level design.

The production migration history does **not** match the repository's canonical migration filenames/versions even though the local migration-hygiene check passes. No destructive or speculative database migration was applied during this audit. A controlled reconciliation plan should be prepared and tested on a Supabase branch before any migration-history changes are made.

## Remaining deployment requirements

| Priority | Requirement | Reason |
| --- | --- | --- |
| Critical | Configure `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or supported alias) in the deployment environment | Required for the app's Supabase client, authenticated flows, and complete smoke testing. |
| High | Enable Supabase Auth leaked-password protection | The live Supabase security advisor reports it is disabled; enable it per the documented password-security guidance. [1] |
| High | Reconcile live and repository migration histories on a non-production branch | Required to make database deployments auditable and avoid accidental duplicate/drifted schema changes. |
| Release | Set `ANDROID_APP_LINKS_SHA256` and `IOS_ASSOCIATED_DOMAIN_APP_ID` | Mobile readiness check warns that these remain placeholders for store release. |
| Validation | Run authenticated E2E tests with two non-admin users and one admin test account | Needed to prove email login, password reset, Google OAuth, profile persistence, cross-user RLS isolation, and admin access against the configured deployment. |

## Tests executed

| Command or flow | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm supabase:migrations:check` | Passed: 36 canonical migrations, no duplicate versions |
| `pnpm routes:check` | Passed: 75 required routes/assets |
| `pnpm imports:check` | Passed |
| `pnpm mobile:check` | Passed with two release-configuration warnings |
| `pnpm lint` | Passed |
| `pnpm check` | Passed |
| `pnpm test` | Passed: 35 tests, 10 suites |
| `pnpm build` | Passed |
| `pnpm verify` | Passed |
| Corrected public production smoke test | Core routes and protected redirects passed; failed only because anon key is absent locally |
| Browser: public homepage | Passed; Arabic RTL content and navigation rendered, no console output |
| Browser: Quran reader `/quran/1` | Passed; rendered Al-Fātiḥah and loaded audio duration/control |
| Browser: local prayer times | Passed after repair; rendered fallback schedule and metadata |

## References

[1]: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection "Supabase Auth password security guidance"
