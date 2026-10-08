# ZIKR — Current Project Status

**Production branch:** `main`  
**Last reconciled:** 2026-10-08  
**Repository:** `zikrcontact-del/Zikr`  
**Production origin:** `https://zikrmediaofficial.vercel.app`

## Current Vercel/Supabase binding

The production Vercel project `zikr` is configured against Supabase project `wvetcauyerlkqvmntajq` and the repository's active runtime validation files use the same canonical Supabase URL.

The repository's active production configuration was rechecked during the 2026-10-08 reconciliation:

- `supabase/config.toml` points to `wvetcauyerlkqvmntajq`.
- `scripts/validate-deployment-env.mjs` enforces `https://wvetcauyerlkqvmntajq.supabase.co`.
- `scripts/verify-auth-config.mjs` uses the same Supabase Auth provider callback.
- `scripts/verify-hygiene.mjs` treats obsolete Supabase/repository URLs as forbidden runtime references rather than active configuration.

## Source and route integrity

The repository contains the previously verified application route, API, content, offline, authentication, and hygiene checks. Historical audit results remain historical and are not treated as proof of the current live schema.

## Supabase production state

The selected production target is `wvetcauyerlkqvmntajq`.

The live reconciliation previously confirmed that the production database has the newer migration chain through the October 2026 changes, including the background reminder Quran fields that were missing from an older deployment's runtime error.

Security-advisor findings still require deliberate review of permissive/public policies and internal server-only tables. No broad RLS rewrite is performed merely to silence advisory output.

## CI / deployment

- GitHub repository access is now confirmed with admin/maintain/push permissions.
- The active `.github/workflows/supabase-production-health.yml` is already pinned to the canonical Supabase project `wvetcauyerlkqvmntajq`.
- Vercel remains the production deployment platform for the linked `main` branch.
- GitHub Actions is the production owner for recurring video generation and social publishing.
- CircleCI is the application build/documentation, Android release, Supabase gate, and English-content lane; it does not run the production video/social worker.
- Production release certification for the current cleanup was completed on 2026-10-08: Vercel deployment `dpl_FkavSSvEDy4vom7p6zvoFLN28aq9` is READY and the canonical alias `zikrmediaofficial.vercel.app` is attached to that deployment.

## Historical references

Older audit documents may still mention retired project references such as `eydxvcamhjhajxjrsgym` or earlier repositories. They are retained when they are explicitly historical records. Active runtime configuration and current operational workflows must use the canonical project documented above.

## Required next verification

1. Keep the production deployment and canonical alias under controlled-release ownership.
2. Monitor post-release runtime errors and worker queues.
3. Keep Supabase security-advisor cleanup and Auth security settings as separate, reviewed changes.
