# ZIKR Remediation Closeout — 2026-11-01

## Scope and baseline
- Repository: `zikrofficial-X/Zikr`
- Base: `main` at `4547d87212f4ed65a41fd3c6cde579ef15460cf2`
- Work branch: `codex/zikr-final-cleanup-2026-11-01`
- This is a source-level audit. It does not assert live browser, Android, Supabase-account, Vercel-account or religious editorial acceptance.

## Implemented in this branch
1. Video detail route shares one request-scoped video lookup between metadata and page rendering and removes a full catalogue fetch from `generateStaticParams` on a force-dynamic, noindex route.
2. `PageSkeleton` becomes a server component, with a regression test for its server-only loading-fallback usage.
3. Both regression tests are registered in `pnpm test`.
4. CSP `frame-src` permits the Google Tag Manager noscript iframe.
5. AdSense source audit checks Kids subtree exclusion, custom-domain warning and explicitly distinguishes source checks from publisher approval.
6. Search Console source audit checks GTM CSP frame-src.
7. This repair branch is configured to run the full `pnpm verify` suite.

## Legacy and duplication decisions

### Retain compatibility routes
Admin video legacy route files are redirect aliases to canonical destinations; they are required for old bookmarks/deep links and the admin architecture tests. Do not delete them solely because they duplicate a route name.

### Retain active components in legacy folders until moved safely
- `src/app/admin/videos/videos-client.tsx` is still imported by canonical `/admin/video/requests`. It is active. A separate refactor may move it into feature-owned components after import tracing.
- `src/app/admin/ai-video/ai-video-client.tsx` needs import tracing against the canonical studio before retirement.

### Retain Supabase migration history
- `supabase/migrations`: 389 current migration files.
- `supabase/migrations_archive`: 35 archived historical files.
- Several migrations share identical blob contents under different timestamps/names. Preserve them; the applied ledger and duplicate-policy checks depend on immutable history. Never delete, rename, re-order or merge applied migration files as filesystem cleanup.
- `supabase/legacy_migrations` is historical compatibility material and requires production-ledger/dependency proof before retirement.

### Retain documentation archive
`docs/archive` is historical audit/release evidence. Refresh conflicting current information in active docs, rather than deleting archive history.

### Review-only, not proven duplicates
- `src/lib/i18n.ts` (client-safe types/helpers) and `src/lib/i18n/server.ts` (server-only cookie reader) serve different responsibilities.
- `src/lib/utils.ts` and `src/lib/utils/companions.ts` are not duplicate implementations; the latter re-exports feature-owned helpers.
- Admin verification scripts have overlapping scope but assert different architecture/security/governance contracts. Do not consolidate before checking all package scripts/CI callers.

## Not changed / owner or external validation required
- Branch protection was recorded as disabled in the comprehensive audit. Available GitHub actions here do not expose a branch-protection/ruleset write; enable required Quality Gate checks in repository settings.
- Vercel environment deletion, settings mutation and production alias changes were not performed.
- No production Supabase rows, schemas, migration ledger, grants, RLS, buckets or storage objects were deleted or modified by this branch.
- No database table or storage object cleanup without a recoverable export/backup plus FK, RPC, trigger and public URL reference tracing.
- Physical Android/iOS checks, full browser E2E and qualified religious/editorial review remain acceptance gates.
- AdSense approval and Search Console ownership cannot be verified from repository source alone.

## Verification
The PR quality gate is configured to run `pnpm verify` for this branch. Merge only after the branch's own gate is green. The gate is not proof of live provider credentials, account approval or device acceptance.
