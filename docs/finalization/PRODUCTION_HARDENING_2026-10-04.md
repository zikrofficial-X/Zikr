# ZIKR Production Hardening — 2026-10-04

## Scope

This checkpoint covers production runtime errors, Supabase schema alignment, scheduler isolation, and CircleCI configuration verification.

## Confirmed production issues fixed

### 1. Content library schema drift

Production code requested `content_library.summary_en`, while the production table did not contain that column. This caused Supabase REST 400 errors affecting sitemap generation and content-library reads.

Resolution:

- Added migration `20261004190000_content_library_summary_en.sql`.
- Applied the column to the production Supabase database.
- Extended `scripts/verify-supabase-production.mjs` to check the column through the public API.
- The Arabic fields remain canonical; English summary is optional.

### 2. Dynamic content route

`/content/[slug]` used `cookies()` through the locale resolver while also participating in static generation through `revalidate` and `generateStaticParams`. Production recorded repeated `DYNAMIC_SERVER_USAGE` failures.

Resolution:

- Converted the route to explicit dynamic rendering.
- Removed `generateStaticParams` from this route so content pages are not statically evaluated with request-time locale state.
- Data-level caching remains handled by the content-library service.

### 3. Translation queue exposure

`content_translation_queue` is a server-side queue and must not be client-readable.

Resolution:

- Added explicit restrictive deny-all policies for `anon` and `authenticated`.
- Service-role/server-side processing remains the intended access path.
- This removed the Supabase RLS-enabled-without-policy advisor finding for this queue.

### 4. Urgent video dispatcher

The five-minute urgent dispatcher could theoretically overlap with another dispatcher run.

Resolution:

- Added workflow concurrency protection.
- Added a three-minute execution timeout.
- The heavy generation worker remains protected by its own separate concurrency group.

## Scheduler ownership

The project intentionally uses different schedulers for different responsibilities:

| Responsibility | Owner |
|---|---|
| Video generation worker | GitHub Actions |
| Urgent Run Now signal | GitHub Actions |
| Minute-level prayer notifications | Supabase pg_cron |
| Daily source-verified content agent | Supabase pg_cron |
| YouTube/Facebook sync | Supabase pg_cron |
| CircleCI background processing | Manual recovery only |

Vercel does not own video cron scheduling.

## CircleCI

CircleCI remains responsible for:

- canonical repository verification;
- production Supabase health gate;
- security/dependency audit;
- Android release builds;
- deliberate manual background-job recovery.

GitHub now validates the CircleCI configuration itself using the official CircleCI CLI before changes to `.circleci/config.yml` are accepted.

The authoritative file remains:

`.circleci/config.yml`

Required CircleCI runtime secrets are supplied through CircleCI Project/Context environment variables and are never committed to Git.

## Remaining manual security action

Supabase Auth still reports **Leaked Password Protection disabled**. This is an Auth project setting rather than an application-code defect. It must be enabled in Supabase Auth settings before the security gate can be considered fully green.

## Verification gates

A production release is not considered healthy until all of the following pass:

- GitHub Quality Gate
- CircleCI configuration validation
- CircleCI source verification / production gate
- Vercel production deployment
- Supabase production health
- no schema-contract errors in runtime logs
- scheduler ownership checks