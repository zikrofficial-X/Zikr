# Zikr platform audit — final evidence report

**Date:** 15 August 2026  
**Repository:** `mohamedalaa7785-cpu/Zikr`  
**Final commit:** `5954663cb8b2751dcc8fc0f681902af00fab2f30`  
**Production URL:** `https://zikrmediaofficial.vercel.app`

## Executive status

The repository is clean, the final commit is pushed to `origin/main`, the Vercel deployment for that commit is `READY`, and the complete local verification suite passes with **56 tests passing and 0 failures**. Production smoke tests returned HTTP 200 for the home page, Quran, Hadith, Dua, prayer times, Qibla, settings, login, and the public push-key endpoint. Unauthenticated writes to the push subscription and internal video-processing endpoints correctly returned HTTP 401.

The remaining findings are explicitly recorded rather than hidden. GitHub hosted runners remain blocked by an account-level billing lock, the GitHub `main` branch has no protection rules, Supabase’s installed `pg_net` extension remains in `public` because this installation rejects `ALTER EXTENSION ... SET SCHEMA`, and Supabase still reports leaked-password protection as disabled because the current dashboard exposed no control for that setting. No unsafe workaround or destructive extension replacement was applied.

## Changes implemented

| Area | Evidence-based result |
|---|---|
| GitHub Actions | `ci.yml` and `background-jobs.yml` remain `workflow_dispatch`-only. Their setup order uses pnpm before Node cache initialization. Documentation now states that they are manual verification/recovery paths, not production schedulers. |
| Vercel build gate | `vercel.json` uses `pnpm install --frozen-lockfile` and `pnpm verify`. The deployment for commit `5954663` completed with `READY` and aliases include `zikrmediaofficial.vercel.app`. |
| Supabase migration alignment | The local scheduler file is now `supabase/migrations/20260814160000_prayer_push_scheduler.sql`, matching the production ledger version. The SQL content was preserved byte-for-byte; no duplicate migration was applied. |
| Supabase scheduler | Production has one active `zikr-prayer-push-dispatch` cron job and one active `zikr-video-processing` cron job, both scheduled every minute. Recent `cron.job_run_details` rows for both jobs were `succeeded`. |
| RLS and secrets | All inventoried public tables have RLS enabled. Scheduler settings deny public access, push subscriptions are scoped to `auth.uid()`, and `get_push_scheduler_secret` is executable only by `service_role`. The service-role key remains server-only. |
| Internal queue route | `/api/internal/video-processing` verifies the scheduler bearer secret through the service-role-only RPC, rejects unauthorized requests, and uses conditional pending-row claims before external side effects. |
| OAuth | Google initiation uses the canonical application callback and minimal provider parameters. Callback code exchange uses the server Supabase client, safely extracts relative `next` paths, and performs a server-side profile upsert without blocking login on profile-write failure. |
| Operations documentation | Updated the GitHub guide, quick start, deployment checklist, launch checklist, architecture overview, background-jobs runbook, production-scheduling runbook, README banner, and completion report to remove stale GitHub-as-scheduler instructions. |

## Platform inventory

### GitHub

The repository is public with `main` as its default branch. Only the Continuous Integration and Background Jobs workflows are active. The branch has no protection configuration. Recent historical workflow runs failed before usable runner logs were available, consistent with the previously recorded GitHub billing-lock message. This is an account-level constraint and cannot be repaired through workflow YAML.

### Supabase

The production project `eydxvcamhjhajxjrsgym` is healthy. The migration ledger contains 121 versions, matching the 121 local migration files after the scheduler filename alignment. The remote scheduler row is version `20260814160000` with a null name; the old local version `20260814074720` is absent remotely.

The deployed Edge Functions are `health`, `spiritual-ai`, and `prayer-notification-worker`, all active. JWT verification is enabled for `spiritual-ai`; the health and prayer worker functions use their intended public/custom-auth boundaries. The production scheduler and recent cron runs were verified directly.

Security advisors report two warnings. First, `pg_net` is installed in `public`; an explicitly prepared hardening migration failed with `extension "pg_net" does not support SET SCHEMA`, and the failure was atomic. A follow-up query confirmed that the extension and cron state remained unchanged. Dropping and recreating `pg_net` was not attempted because it could disrupt `pg_net` state and the active scheduler.

Second, leaked-password protection is reported as disabled. The Supabase Attack Protection page was inspected after user confirmation. The only available switch was CAPTCHA, not leaked-password protection; it was returned to its original disabled state and no unintended setting was saved. The row exposed only provider configuration and no actionable password-protection toggle. This remains an owner/dashboard limitation and should be revisited if Supabase exposes the control or enables it for the project plan.

Performance advisors primarily report unused indexes and multiple permissive policies. These are optimization warnings rather than evidence that RLS is disabled. Removing indexes or merging policies was not done speculatively because it could affect live query paths and policy semantics.

### Vercel

Project `zikr` is a Next.js project with the canonical custom domain, no password protection, and preview SSO protection excluded for custom domains. The newest production deployment is `dpl_D5ibMbg3qoVM8edZWNXGgj9JwQ2X`, built from the final commit, with state `READY`. The latest one-hour runtime-error query returned **no runtime errors**.

Historical seven-day clusters were found on older deployments, including a previous battle date dereference, old profiles permission errors, and old missing Supabase environment messages. Current source and the new deployment were checked; the battle route now uses safe optional chaining, and current production smoke tests did not reproduce those failures.

## Tests and production checks

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed as part of verification and deployment gate configuration |
| `pnpm verify` | Passed on final repository state |
| Automated tests | 56 passed, 0 failed |
| TypeScript | Passed |
| ESLint | Passed |
| Next.js production build | Passed; 38 static pages generated and all listed routes compiled |
| Migration checks | Passed |
| Production `/` | HTTP 200 |
| Production `/quran`, `/hadith`, `/dua` | HTTP 200 |
| Production `/prayer-times`, `/qibla`, `/settings`, `/auth/login` | HTTP 200 |
| Production `/api/push/public-key` | HTTP 200; response contains only the public key |
| Unauthenticated `POST /api/push/subscription` | HTTP 401 |
| Unauthenticated `POST /api/internal/video-processing` | HTTP 401 |
| Vercel deployment for final commit | READY |
| Vercel runtime errors, last hour | None found |
| Git working tree | Clean; `HEAD` equals `origin/main` |

## Remaining owner-level actions

The GitHub account owner must resolve the billing lock if hosted workflows are needed. Until then, production verification remains on Vercel and production background work remains on Supabase cron.

The repository owner should decide whether to add branch protection to `main`. Because the current CI workflow is manual-only and the account has no active hosted runners, a protection rule must be designed so it does not require an unavailable status check.

The Supabase owner should revisit leaked-password protection through the project’s Auth settings or Supabase support/documentation when the project UI exposes a usable control. The `pg_net` schema warning should be discussed with Supabase before any extension replacement or migration, because the installed extension explicitly rejects `SET SCHEMA`.

## References

[1]: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions "GitHub Actions workflow syntax"  
[2]: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public "Supabase extension in public schema advisor"  
[3]: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection "Supabase leaked-password protection"  
[4]: https://supabase.com/docs/guides/database/extensions/pg_net "Supabase pg_net extension"  
[5]: https://vercel.com/docs/project-configuration/vercel-json "Vercel project configuration"  
[6]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
