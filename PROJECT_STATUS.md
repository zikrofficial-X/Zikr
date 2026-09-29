# ZIKR — Current Project Status

**Production branch:** `main`
**Last audited:** September 29, 2026
**Repository:** `zikr-org/Zikr`
**Production origin:** `https://zikrmediaofficial.vercel.app`

## Audit scope completed

A repository-wide and live-environment audit was performed across application source/configuration, migrations, Supabase schema/RLS, CI/deployment configuration, native mobile configuration, offline assets, and repository hygiene.

### Source and route integrity

- 100 page route files verified by the repository route audit.
- 64 API route files verified by the repository route audit.
- Local import smoke check passed.
- Content integrity check passed.
- Project integrity check passed: 292 offline routes and 16 datasets checked.
- Platform route inventory passed: 76 required assets, 100 pages, 64 API routes.
- Mobile readiness, offline content, placeholder-media, auth, canonical URL, hygiene, AdSense, and Search Console checks passed on the supplied repository snapshot.

### Supabase live state

- Connected target project: `kdotmrjfecgafiommzwz` and currently `ACTIVE_HEALTHY`.
- The previously missing remote migration `20260929025052` is reconciled locally.
- The security/performance hardening migrations were applied to the connected target and their repository filenames were corrected to the exact versions Supabase assigned (`20260929035722`, `20260929035746`, `20260929035802`, `20260929035817`, `20260929035845`).
- Verified redundant indexes were removed and missing foreign-key covering indexes were added.
- Unrestricted authenticated CRUD policies on `videos` and `video_categories` were removed; admin writes remain behind `private.is_admin_user()` and public reads are restricted to published content.
- Tawasheeh owner policies were consolidated and changed to initplan-safe `select auth.uid()` expressions.
- Public execution of `handle_new_user()` was revoked; the function remains available to the database trigger mechanism.
- `update_updated_at_column()` now has a fixed `pg_catalog` search path.
- Exact duplicate public-read policies were removed; the live database now reports zero exact duplicate policy groups for public schema policies.

### Remaining Supabase advisory items

- `admin_audit_log`, `admin_settings`, and `content_revisions` have RLS enabled without API policies. These are intentionally server-only/internal tables; no client policy is being added merely to silence the informational linter.
- Supabase Auth leaked-password protection is still disabled. This is an Auth project setting rather than a repository SQL defect and must be enabled in the Supabase Auth security settings.

### Dependency/configuration integrity

- `package.json` and `pnpm-lock.yaml` use pnpm 9.15.0.
- Node runtime baseline is 22.x.
- Capacitor runtime packages are 7.x while the repository CLI is 8.5.1. This is a known toolchain mismatch retained from the existing project; changing it safely requires an intentional Capacitor CLI/runtime/native-project migration rather than a one-line version edit.
- No `package-lock.json` or `yarn.lock` is tracked.

### CI / deployment

- GitHub Actions are intentionally retired from the production CI path.
- CircleCI remains the CI/recovery path.
- Vercel builds with the repository's frozen pnpm install and `pnpm build`.
- The connected production Supabase project is healthy, but the GitHub Supabase Preview check is still linked to the old restricted Supabase organization/project (`eydxvcamhjhajxjrsgym`). The check now fails because that old organization is under service restrictions, not because of the current target database schema.
- Vercel and CircleCI checks are pending for the latest `main` commit and therefore production release certification is not claimed yet.

## Release blockers

1. Reconnect the GitHub Supabase integration/Preview check from the retired restricted project to the current `kdotmrjfecgafiommzwz` project. This cannot be corrected by repository SQL alone because it is an external GitHub/Supabase integration setting.
2. Vercel must complete a fresh successful production build for the latest `main` commit.
3. CircleCI `ci-check` must complete successfully.
4. Native Android/iOS release builds require validation in their real release environments.
5. Supabase Auth leaked-password protection should be enabled in the project security settings.

Historical ZIP exports and older deployment artifacts are not treated as competing sources of truth.
