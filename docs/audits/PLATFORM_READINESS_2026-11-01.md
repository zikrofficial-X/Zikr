# ZIKR External Platform Readiness — 2026-11-01

## Final audited baseline
- Repository: `zikrofficial-X/Zikr`
- Current production main commit at final recheck: `d4b5f794dd365c490d3e2e96843fb59614f20215` (docs-only follow-up after the application code release at `18349e48fa601ffe16d13014549f03ca5186a07d`).
- Vercel project: `zikr`, team `zikr3`, linked Git repository `zikrofficial-X/Zikr`
- Supabase project: `ymxdswkaxafakugktsim`
- Follow-up owner controls: [GitHub issue #170](https://github.com/zikrofficial-X/Zikr/issues/170)

## GitHub
- Default branch is `main`; only `main` exists in the branch listing after the completed merges.
- `main.protected=false` and repository rulesets are empty. The connected GitHub integration cannot read the branch-protection endpoint (HTTP 403) and exposes no write action for branch protection/rulesets.
- On the deployed code commit, ZIKR Quality Gate and CircleCI `config-guard` and `application-build-docs` all completed successfully.
- PRs #162, #165, #167, #168 and #169 are merged.
- Owner action: enable Branch Protection or Rulesets for `main`; require pull requests; require the ZIKR Quality Gate, CircleCI config guard and application-build-docs checks; block force pushes and deletion; dismiss stale approvals.
- This cannot safely be claimed complete until it is enabled and re-read in GitHub settings.

## Vercel
- Project uses Next.js and Node 22.x.
- Production deployment `dpl_DcUL7uoysAu63babGUjN9VTYN7QQ` is `READY`, target `production`, built from `main` at `d4b5f794dd365c490d3e2e96843fb59614f20215`.
- Production aliases: `zikrmediaofficial.vercel.app`, `zikr-zikr3.vercel.app`, and `zikr-git-main-zikr3.vercel.app`.
- `zikrmediaofficial.vercel.app` is verified and attached to the current production deployment.
- A production deployment was observed automatically after PR #171 pushed the docs-only follow-up to `main`; the resulting deployment metadata matches the exact Git commit `d4b5f794`. An earlier manual release for the application-code commit `18349e48` was also verified READY.
- `POSTGRES_URL` was changed to the Vercel `sensitive` variable type without retrieving or changing its value. Follow-up metadata confirmed `visibility=secret` and no remaining security issues for this variable.
- Two preview-only `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` entries remain scoped to branch names no longer present: `fix/google-native-login-canonical` and `branding/zikr-identity`. The available Vercel connection exposes list/create/edit but no delete-project-environment-variable action. Do not repurpose them. Owner should remove those two Preview-only entries after confirming no external preview process depends on them; keep the generic Preview and Production entries.
- Preview deployment protection was not weakened.

## Production smoke tests
All checks below were repeated against the public production alias after deployment `dpl_DcUL7uoysAu63babGUjN9VTYN7QQ` for `d4b5f794` reached READY:
- Home page: HTTP 200.
- Valid video `/videos/story-of-musa-full`: HTTP 200, expected YouTube embed ID present, metadata remains noindex.
- Valid dua `/dua/zikr-dua-quran-002250`: HTTP 200 and the expected published Arabic dua text is present.
- Missing video `/videos/non-existent-zikr-smoke-check`: HTTP 200, localized unavailable-content state rendered, `noindex, nofollow`.
- Missing dua `/dua/non-existent-zikr-smoke-check`: HTTP 200, localized unavailable-content state rendered, `noindex, nofollow`.
- None of these returned HTML contained the React streaming-boundary error. The missing-resource pages intentionally render an inline unavailable state rather than throwing a late streamed `notFound()`; consequently they return HTTP 200 with noindex instead of an HTTP 404.
- Vercel Runtime Errors for the 10-minute period after smoke checks reported no runtime errors. Deployment-specific error/fatal runtime logs for that same period were empty.

## Supabase
- Project status: `ACTIVE_HEALTHY`; PostgreSQL 17.11.
- Production exposes 86 public tables; all 86 have RLS enabled.
- Repository and production migration ledgers both contain 391 versions; there is no local-only or production-only migration version.
- Production Health passed public Auth/content checks and confirmed anonymous access to `content_translation_queue` is denied with HTTP 401. No extra anon grants were introduced.
- Security advisor:
  - `youtube_sync_state` has RLS enabled and no policies. This is intended default-deny protection for a private sync-state table; do not add an anonymous policy.
  - Leaked-password protection is disabled. The connected Supabase tools expose no Auth password-security setting update. Owner action: Supabase Dashboard → Authentication → Settings → Password Security; enable compromised-password checks, then rerun Security Advisor.
- Performance advisor reported 64 indexes with no observed usage in its snapshot. These are review candidates only, not approved deletion candidates. Capture usage across a representative business cycle and check query plans, PK/unique constraints and FK support before proposing any individual index drop.
- No production table, row, policy, schema, migration, index or storage object was destructively changed as part of this closeout.

## Remaining owner / human acceptance
- GitHub branch protection and required checks.
- Remove the two stale Preview-only Vercel environment-variable records after dependency confirmation.
- Enable Supabase leaked-password protection and re-run advisor.
- Physical Android/iOS device and full interactive browser acceptance; CI mobile-readiness passed but a real device test was not available through these connections.
- Qualified human religious/editorial review of Quran text, hadith grading and rulings. Automation must not self-approve religious sources.
- Google Search Console ownership, AdSense publisher account approval, live ad serving and CMP/account status remain unverified because they require the owner’s Google account.
- Review the 64 advisor-flagged indexes before any removal; no indexes were dropped.

## Safety decisions
- No applied migration was deleted, renamed, reordered or rewritten.
- No compatibility route redirect was deleted.
- Active Admin Video Studio and Video Requests clients were moved to feature-owned modules; canonical route imports were updated.
- No production deployment protection was removed.
