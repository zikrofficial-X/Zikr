# Phase 5 — Environment / Secrets / Configuration Reconciliation
## ZIKR Finalization — 2026-10-02

### Scope

This phase reconciles environment-variable contracts across:

- Next.js runtime;
- `.env.example`;
- GitHub Actions;
- CircleCI;
- Supabase Edge Functions;
- Vercel production runtime evidence;
- repository hygiene/canonical-configuration checks.

Production secret **values** were not read, copied, printed, rotated, or changed.

### Canonical infrastructure

| Resource | Current value |
|---|---|
| Production site | `https://zikrmediaofficial.vercel.app` |
| Supabase project | `nmdeazfmtncelykzxkhs` |
| Supabase URL | `https://nmdeazfmtncelykzxkhs.supabase.co` |
| Vercel project | `zikr` |
| Vercel team | `zikr` |
| Latest observed production deployment | `dpl_73RViL1k4S6bqLf6aQrTLHoeP7Tq` |
| Latest production commit | `e1b84fac78d1ddb1fb971f7ec456b5ae37936edf` |
| Latest deployment state | READY |
| GitHub Vercel commit status | success |

### Repository-side fixes completed

#### 1. `.env.example` reconciliation

Added the previously undocumented worker/CI contract entries:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `AUTO_VIDEO_ENABLED`
- `AUTO_VIDEO_BATCH_SIZE`
- `AUTO_VIDEO_SECONDS`
- `VIDEO_AI_ATTEMPTS_PER_RUN`
- `HF_WAN_VIDEO_ENABLED`
- `HF_LTX_FAST_VIDEO_ENABLED`
- `HF_WAN_SPACE`
- `HF_LTX_FAST_SPACE`
- `HF_VIDEO_PYTHON`
- `HF_TOKEN`
- `VERIFY_VIDEO_RUNTIME_TOOLS`
- `BACKGROUND_JOB_TARGET`
- `VIDEO_TEMPLATE_VERSION`
- `VIDEO_PUBLISH_SCHEDULE`
- `YOUTUBE_SYNC_SECRET`

The existing canonical web variables remain:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `AUTH_CALLBACK_URL`

#### 2. Environment documentation corrected

`docs/environment-variables.md` was reconciled to the current architecture.

The old statement that runtime environment variables were validated using Zod was removed because the current repository uses the custom `scripts/validate-deployment-env.mjs` contract instead.

The document now separates:

- web/runtime variables;
- provider integrations;
- video worker variables;
- Supabase Edge Function variables;
- GitHub Actions ownership;
- CircleCI recovery variables;
- Vercel system variables;
- retired variables.

#### 3. Retired Supabase project reference removed

`PRODUCTION_DEPLOYMENT_v1.1.0.md` contained the obsolete project:

`https://eydxvcamhjhajxjrsgym.supabase.co`

It now points to the canonical current project:

`https://nmdeazfmtncelykzxkhs.supabase.co`

#### 4. Hygiene guard strengthened

`scripts/verify-hygiene.mjs` now treats the old Supabase project hostname as a forbidden runtime/configuration reference and explicitly scans `PRODUCTION_DEPLOYMENT_v1.1.0.md`.

This prevents the documented infrastructure drift from silently returning.

### Runtime evidence

Vercel production runtime errors for the previous 7-day window contained historical environment/configuration failures, including:

- `Missing NEXT_PUBLIC_SUPABASE_ANON_KEY` on an older deployment;
- old Supabase storage quota restriction errors;
- historical stale Gemini model errors;
- historical schema/configuration mismatches.

The `Missing NEXT_PUBLIC_SUPABASE_ANON_KEY` occurrences ended on **2026-09-28** and are tied to an older deployment.

For the latest 24-hour production window checked during this phase:

- no runtime logs matching `Missing`;
- no runtime logs matching `SUPABASE`.

The latest production deployment associated with `main` is READY, and the GitHub Vercel status for commit `e1b84fac78d1ddb1fb971f7ec456b5ae37936edf` is `success`.

### Supabase evidence

The connected Supabase project reports:

- status: `ACTIVE_HEALTHY`;
- PostgreSQL 17.6.1.166;
- region: `us-east-1`.

The active Edge Functions are:

- `spiritual-ai`;
- `health`;
- `source-verified-content-agent`;
- `prayer-notification-worker`.

Their documented secret ownership is preserved:

- service-role credentials remain server/Edge only;
- scheduler and VAPID private material remain in protected database/runtime state;
- external source credentials continue to resolve by the existing production secret-name indirection.

### Secret-store boundary

The repository and runtime evidence establish the expected secret **contract**, but the connected Vercel/GitHub/CircleCI interfaces used in this audit do not expose the actual secret inventory or values.

Therefore this phase does **not** claim that every configured Vercel/GitHub/CircleCI variable name has been independently enumerated from the secret store.

Behavioral evidence currently available is:

1. latest Vercel production deployment is READY;
2. latest commit's Vercel status is success;
3. latest 24-hour production logs contain no missing-environment or Supabase-config log matches;
4. the scheduled worker workflow contract contains explicit runtime validation for its required service-role credential.

### Retired configuration

The application validation continues to reject:

- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

The canonical Meta variable remains `FACEBOOK_GRAPH_API_VERSION`; `META_GRAPH_API_VERSION` remains forbidden.

### Production changes

**No production secret or Vercel/Supabase runtime setting was modified in this phase.**

All changes were repository-side documentation/example/validation changes on:

`audit/phase-0-1-finalization`

### Phase 5 conclusion

Repository configuration is now materially aligned with the current ZIKR architecture, and historical infrastructure references that could reintroduce drift have been removed or guarded.

The remaining limitation is explicit: the audit can verify behavior and repository contracts, but cannot independently enumerate the secret-store inventories exposed outside the connected interfaces.

