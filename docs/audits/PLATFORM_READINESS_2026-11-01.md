# ZIKR External Platform Readiness — 2026-11-01

## Audited baseline
- Repository: `zikrofficial-X/Zikr`
- `main` at the time of this check: `cec54b8e7533c8ce37b4345a4ae84f1cd9a1598c`
- Vercel project: `zikr` in team `zikr3`, linked to `zikrofficial-X/Zikr`
- Supabase project: `ymxdswkaxafakugktsim`

## GitHub
- Default branch is `main`; only `main` exists in the branch listing at audit time.
- `main.protected` is false and the repository has no active repository rulesets.
- The connected GitHub integration cannot read the branch-protection endpoint (HTTP 403) and exposes no write action for branch protection/rulesets. Therefore this setting cannot be changed through the available connection in this run.
- The most recent `main` Quality Gate and Supabase Production Health runs on `cec54b8` both completed successfully.
- Owner action: enable branch protection/rulesets in GitHub Settings for `main`, require the ZIKR Quality Gate plus CircleCI config guard and application-build-docs checks, require pull requests, block force-pushes and deletion, and dismiss stale approvals after new commits.

## Vercel
- Project is correctly linked to `zikrofficial-X/Zikr`; the project uses Next.js and Node 22.x.
- The latest production deployment inspected is READY and points to `main` at `cec54b8`.
- The attached public alias `zikrmediaofficial.vercel.app` is verified and successfully served the public ZIKR home page during the live availability check.
- Preview deployment protection remains enabled; it was not weakened.
- `POSTGRES_URL` was changed from a readable encrypted variable to Vercel's `sensitive` type without retrieving or changing its value. A follow-up metadata read confirmed `visibility=secret` and no remaining `securityIssues` for this variable.
- Two preview-only `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` entries are still scoped to branch names that no longer exist. The available Vercel connector exposes list/create/edit actions but no delete-project-environment-variable action. They were not repurposed or silently removed. Remove those two stale entries from Vercel Project → Settings → Environment Variables after confirming no external preview workflow still depends on them; keep the generic Preview and Production entries.
- No other environment-variable values were decrypted or copied into this audit.

## Supabase
- Project status: `ACTIVE_HEALTHY`; PostgreSQL 17.11.
- Production exposes 86 public tables. All 86 have RLS enabled.
- Repository and production migration ledgers both contain 391 versions; no version exists only in one side of the comparison.
- The Production Health workflow passes the public Auth/content probes and confirms anonymous access to `content_translation_queue` is denied with HTTP 401.
- Security advisor findings:
  - `youtube_sync_state` has RLS enabled and no policies. This is default-deny behavior for a private sync-state table and is intentionally retained; do not create an anonymous policy.
  - Leaked-password protection is disabled. The connected Supabase actions do not expose an Auth password-security settings update. Enable compromised-password checks in Supabase Dashboard → Authentication → Settings → Password Security, then rerun the security advisor.
- Performance advisor reported 64 indexes with no observed usage. These are candidates for workload review only, not deletion candidates yet. The advisor snapshot is not sufficient proof that an index is unused over a complete business cycle. Capture index usage after representative traffic and check query plans, constraints and FK support before proposing individual drops.

## Public web and release checks
- `https://zikrmediaofficial.vercel.app` is reachable and serves the public home-page content.
- This is a Vercel-hosted subdomain, not an independently registered custom domain. Google Search Console ownership and AdSense account/review status are not available through the connected GitHub/Vercel/Supabase actions and remain unverified.
- CI mobile-readiness checks passed, but no physical Android device/emulator verification was available here.
- Religious text/source review and final editorial sign-off require a qualified human reviewer; automation must not self-approve Quran, hadith grading or religious rulings.

## Safety decisions
- No Supabase table, index, policy, migration, row or storage object was deleted during this audit.
- No applied migration was renamed, reordered or rewritten.
- No public deployment protection was removed.
- The feature-client relocation is source-only and keeps the legacy route redirects intact.
