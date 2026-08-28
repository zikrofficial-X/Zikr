# ZIKR audit findings — 2026-08-22

## Attachment completeness
The provided `pasted_content_3.txt` ends at line 1026 during Phase 33 after `1. inspect` and `2. modify`; the release checklist is truncated in the attachment itself.

## Production
- Canonical URL tested: https://zikrmediaofficial.vercel.app
- `/api/health` returned `{"ok":true,"service":"zikr","environment":"production"}` during the audit.
- Production route smoke completed with 0 failures. Protected routes returned expected HTTP 307 redirects; public routes and public APIs returned 200.

## Toolchain
- `pnpm install --frozen-lockfile` succeeded.
- `pnpm test`: 60 passed, 0 failed.
- `pnpm build`: succeeded.
- `pnpm routes:check`: verified 75 routes/assets.
- `pnpm imports:check`: passed.
- `pnpm mobile:check`: passed.
- `pnpm supabase:migrations:replay`: passed local migration validation and GIN/searchable checks.
- `pnpm deploy:check`: 0 failures, 16 warnings in local sandbox; warnings include absent migration-only/service integrations, not proof of missing production secrets.
- `pnpm run verify-mobile-readiness` is not a package script; the canonical script is `pnpm mobile:check`.

## Supabase live project
- Project: Zikr, ref `eydxvcamhjhajxjrsgym`, status ACTIVE_HEALTHY, PostgreSQL 17.6.1.104, region eu-west-1.
- Security advisors: `pg_net` installed in public schema (WARN); Supabase leaked-password protection disabled (WARN). Remediation URLs are in the advisor response.
- Performance advisors: multiple unused-index INFO notices; no critical performance advisor was observed in the sampled output. Do not remove indexes without query evidence.
- Edge Functions observed: `health` active v7 verify_jwt false; `spiritual-ai` active v7 verify_jwt true; `prayer-notification-worker` active v86 verify_jwt false; `source-verified-content-agent` active v3 verify_jwt false.
- Live migration ledger contains archived legacy entries and many timestamped migrations. No production reset or fake migration status was performed.

## GitHub
- Repository: `mohamedalaa7785-cpu/Zikr`.
- Branch list currently shows `main` only remotely.
- GitHub-hosted Actions workflows are manual fallback workflows because runners are externally unavailable; CircleCI and Vercel are the working primary checks.
- GitHub Actions secret-name listing returned HTTP 403 due integration permissions; no secret values were requested or exposed.
- Workflow files use Node 22 and pnpm 9.15.0 with frozen lockfile.

## SimilarWeb / external skill search
- SimilarWeb requests for `zikrmediaofficial.vercel.app` were not returned by the current data provider, so no traffic/ranking conclusions were made.
- Internet Skill Finder real-time fetch fell back to cache after GitHub API parsing errors and returned no matching skills; no untrusted external code was imported.
