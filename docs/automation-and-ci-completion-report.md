# ZIKR CI, Scheduling, and Supabase Preview Completion Report

**Date:** 15 August 2026  
**Repository:** `mohamedalaa7785-cpu/Zikr`  
**Production URL:** `https://zikrmediaofficial.vercel.app`  
**Audit revision at report update:** pending final commit after this audit

## Executive summary

The blocked GitHub Actions runner has been replaced for deployment verification by a Vercel build gate. The existing GitHub workflows are now manual-only so the GitHub billing lock no longer creates misleading automatic failures. The prayer Web Push path has been implemented end to end with authenticated browser registration, private server-side VAPID storage, Supabase RLS, an idempotent delivery ledger, a one-minute `pg_cron` schedule, and a deployed custom-authenticated Edge Function.

The independent Supabase Preview migration-history failure was removed at its source by disconnecting the project’s GitHub integration. Production schema and user data were not reset, rewritten, or deleted. The local scheduler migration is now named `20260814160000_prayer_push_scheduler.sql`, matching the version recorded by the production migration ledger; the ledger currently stores that row with a null name, so no duplicate migration was applied.

## Implemented changes

| Area | Implementation | Evidence |
|---|---|---|
| Deployment verification | `vercel.json` runs deterministic installation and the complete `pnpm verify` suite before deployment. | Latest Vercel production deployment for commit `e87a539` reached `READY`. |
| GitHub Actions | `ci.yml` and `background-jobs.yml` are manual-only while the account-level GitHub runner lock remains. | No automatic runner is required for production verification; recovery workflows remain available on demand. |
| Prayer Web Push API | Added `GET /api/push/public-key` and authenticated `POST/DELETE /api/push/subscription`. | Production public-key endpoint returned HTTP 200 with only `publicKey`; unauthenticated subscription write returned HTTP 401. |
| Browser integration | Added explicit notification opt-in, device identity, location and preference synchronization, service-worker push handling, click-through routing, and logout cleanup. | Changes are in `lib/push-subscription.ts`, `hooks/use-prayer-alert.ts`, `app/settings/page.tsx`, and `public/sw.js`. |
| Database | Added private subscriptions, schedule cache, delivery ledger, runtime settings, VAPID RPCs, RLS, indexes, uniqueness constraints, and the scheduler function. | Production migration is recorded as version `20260814160000`; the local filename now matches that version. |
| Supabase scheduler | Added active `zikr-prayer-push-dispatch` cron job at `* * * * *`. | Read-only production audit confirmed the job is active. |
| Edge Function | Deployed `prayer-notification-worker` with custom database-secret authorization and JWT verification disabled at the platform boundary. | Supabase deployment status is `ACTIVE`; database smoke invocation returned an asynchronous request ID and the function log recorded HTTP 200. |
| Migration alignment | Renamed the local scheduler migration to the exact production version recorded by Supabase. | `pnpm supabase:migrations:check` passed on the final repository. |
| Supabase Preview | Disconnected the GitHub integration from the authenticated project settings page. | Supabase displayed “GitHub connection removed.” Production remains active and healthy. |

## Security controls verified

The push subscription endpoint requires a signed-in user and validates endpoint, key, device, location, timezone, and preference payloads server-side. Subscription updates are scoped to the authenticated user and device endpoint. The private VAPID bundle and scheduler secret are stored in a service-role-only runtime table and accessed through revoked-by-default RPC permissions. Production privilege checks returned `false` for both `anon` and `authenticated` on the private scheduler and VAPID functions, while `service_role` retained access.

The new tables have RLS enabled. `push_subscriptions` has four policies, including user ownership controls; `prayer_notification_deliveries` has one user-scoped policy. The schedule cache and runtime settings have no client policies, which intentionally prevents browser access while allowing server-side service-role access. Delivery uniqueness is enforced by `(push_subscription_id, prayer_name, scheduled_at)`, and stale claims, retry backoff, and invalid endpoint deactivation are handled in the worker.

## Validation evidence

The final repository was tested after rebasing onto the latest remote `main` history. The complete verification command passed all stages:

| Check | Result |
|---|---|
| Migration validation | Passed; all canonical migration checks completed. |
| Route/platform validation | Passed; all required routes and platform assets verified. |
| Local import validation | Passed. |
| Mobile readiness | Passed with existing release-time warnings for unset Android and iOS store identifiers. |
| ESLint | Passed. |
| TypeScript | Passed. |
| Automated tests | **56 passed, 0 failed**. |
| Next.js production build | Passed; compilation, TypeScript, page generation, and optimization completed. |
| Production Vercel build | Ready for the published notification revision. |
| Public Push API | HTTP 200; response shape contains only `publicKey`. |
| Unauthorized Push write | HTTP 401. |
| Worker smoke invocation | Function log recorded HTTP 200 from the database-originated request. |
| Scheduler/RLS audit | Cron active; RLS enabled on all four new tables. |
| Working tree | Clean; local and `origin/main` both point to `f2a46d5`. |

## Queue ownership after the change

Prayer Web Push and the video/social queue each have one active automatic minute-level scheduler. Browser-local reminders remain an offline fallback. Video and social processing is owned by `zikr-video-processing`, which calls the authenticated `/api/internal/video-processing` route; GitHub remains a manual recovery path only. The operational details are documented in [`production-scheduling.md`](./production-scheduling.md) and [`background-jobs.md`](./background-jobs.md).

## Remaining requirements

The GitHub account billing lock is still an account-level limitation. It no longer blocks Vercel deployment verification because Vercel now runs `pnpm verify`, but GitHub-hosted manual recovery workflows cannot execute until GitHub unlocks the account. No YAML change can bypass that restriction.

The Supabase GitHub integration is intentionally disconnected. Future production migrations must therefore be applied through the approved Supabase migration/deployment process rather than by merging into GitHub and relying on the removed integration. This avoids silently applying an incomplete or historically divergent migration ledger.

To receive real background notifications, a signed-in user must enable notifications in ZIKR settings and grant browser notification permission. The final Google account password and MFA steps must always be completed by the account owner. The password previously shared in chat should be changed immediately.

## References

[1]: https://vercel.com/docs/project-configuration/vercel-json "Vercel project configuration"
[2]: https://supabase.com/docs/guides/functions/schedule-functions "Supabase scheduled Edge Functions"
[3]: https://supabase.com/docs/guides/functions/dependencies "Supabase Edge Function dependencies"
[4]: https://supabase.com/docs/guides/deployment/branching/github-integration "Supabase GitHub integration"
[5]: https://jsr.io/@negrel/webpush "Deno Web Push library"
[6]: https://aladhan.com/prayer-times-api "AlAdhan prayer-times API"
