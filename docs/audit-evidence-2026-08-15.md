# ZIKR Full Audit Evidence — 15 Aug 2026

## Repository and GitHub

- Repository: `mohamedalaa7785-cpu/Zikr`, public, default branch `main`.
- Local source inventory: 678 tracked files, 373 TypeScript/TSX files, 123 active SQL migrations plus 34 archived migrations, 30 API route handlers, and 73 page components.
- Current remote `main`: `be8dd9d05adc64cd851359794e22deabcb60f9894`.
- CircleCI bot PR #191 merged into `main` on 2026-08-15 10:22:30 UTC. It changes only `.circleci/config.yml`: `corepack enable` → `sudo corepack enable` for the `cimg/node:22.13` image. Current production deployment is from the merge commit and is READY.
- GitHub Actions permissions: enabled, allowed actions `all`, SHA pinning not required.
- `main` has no branch protection (GitHub REST returned `Branch not protected`, 404).
- Repository security state after repair: secret scanning enabled, push protection enabled, Vulnerability Alerts enabled, and Dependabot security updates enabled. `.github/dependabot.yml` was committed in `c262729`; Dependabot has begun creating dependency-update PRs, which require review rather than auto-merge.
- GitHub-hosted workflows remain manual-only because previous runs failed at runner startup under the account billing lock. Vercel and CircleCI provide CI verification; Supabase provides production scheduling.

## Supabase project

Project: `Zikr`, ref `eydxvcamhjhajxjrsgym`, region `eu-west-1`, PostgreSQL 17.6.1, status `ACTIVE_HEALTHY`.

- Supabase migration history contains the archived legacy markers and current August 2026 migrations. Repository contains 123 active migration files plus 34 archived files. The two new RLS migrations are recorded by Supabase as `20260815104409` and `20260815104455`, and local filenames were aligned in `be8dd9d`.
- Deployed Edge Functions: `health` ACTIVE v7 (`verify_jwt=false`), `spiritual-ai` ACTIVE v7 (`verify_jwt=true`), and `prayer-notification-worker` ACTIVE v37 (`verify_jwt=false`). The latter is intentionally scheduler-authenticated by a secret rather than JWT.
- pg_cron has two active jobs, both `* * * * *`, and recent runs for both jobs succeeded once per minute. Job 1 calls the prayer notification worker through `net.http_post`; job 2 calls `https://zikrmediaofficial.vercel.app/api/internal/video-processing` with the scheduler secret.
- Supabase security advisors returned two WARN findings: `pg_net` is installed in the `public` schema, and leaked password protection is disabled in Auth.
- Supabase performance advisors returned many INFO findings for unused indexes. These are candidates for later removal only after workload validation; no destructive index removal has been applied.
- PostgREST logs show repeated `Warp server error: Thread killed by timeout manager` messages throughout 2026-08-15, often at one-minute intervals. The available metadata exposes only system/project identifiers, not request paths, so the responsible request still needs correlation with Vercel/Supabase request logs before changing cron or API code.
- RLS policies are enabled across the audited public tables. Most user-owned tables enforce `auth.uid() = user_id`; published content tables are publicly readable with `published` predicates; admin writes use `private.is_admin_user()`. Duplicate/overlapping owner policies exist on several tables, including `reading_progress`, `recent_recitations`, `reciter_favorites`, `reminders`, `tawasheeh_favorites`, and `tawasheeh_playlists`, and should be normalized carefully rather than removed blindly.
- `public.prayer_times_cache` was hardened during this audit. It now has one `prayer_times_cache_public_read_only` SELECT policy; the authenticated `ALL` write policy was removed. `prayer_schedule_cache` remains explicitly deny-all to public callers.
- Generated database types include `battles.date_gregorian` as nullable; the production error was therefore an application-side dereference of an absent record, not evidence that the column is missing.

## Vercel project

- Project: `zikr`, id `prj_3J0vdLIhoMucvZ8o1IZ1yXIRYHCi`, team `team_n5mrLz3A1fUncMocWuhYc2er`, Next.js, Node `24.x`.
- Domains: `zikrmediaofficial.vercel.app`, `zikr-zikr.vercel.app`, and `zikr-git-main-zikr.vercel.app`.
- Latest production deployment: `dpl_13MdTuTMaxqratbyYVRAjhfw1gQp`, READY, from GitHub `main` commit `be8dd9d`. No error/fatal runtime logs were found for this deployment in the final 30-minute query, and the final production audit returned 0 issues.
- Project deployment protection: password protection disabled, trusted IP protection disabled, Vercel SSO protection enabled for all except custom domains. The production custom domain remains publicly reachable.
- Aggregated Vercel runtime errors over the last 24 hours included errors from older deployments: 48 `/battles/[slug]` errors from dereferencing `date_gregorian` on an undefined object; two old-deployment Supabase DNS failures pointing to `olryzmbomglblauhdexi.supabase.co`; one malformed JSON error each in `/api/kids/track-share`, `/api/poetry-insight`, and `/api/contact`; one `/api/tawasheeh` negative-limit error; and one PKCE verifier-not-found callback error. These must be separated by deployment before declaring current production regressions.

## Local project scripts

`pnpm verify` runs migration checks, migration replay validation, route checks, import checks, mobile readiness, ESLint, TypeScript, unit/integration tests, and production build. It passed after the audit repairs with 56 tests and 0 failures; the production build compiled successfully.
