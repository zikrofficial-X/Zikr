# ZIKR v1.2.9 — Final Release

## Release summary
- Simplified the admin Social Publishing Center and removed an unused type import.
- Added one-click refresh and a safe **Retry All Failed** action.
- Hardened admin queue operations so retry/delete actions only target failed records.
- Kept YouTube → Facebook publishing idempotent and retry-safe to avoid duplicate posts.
- Reconciled the Supabase migration history through the latest production control-plane marker.
- Removed the obsolete Android 1.1.9 rebuild marker from the repository.
- Preserved the current Node 22 / pnpm 9.15 toolchain and the full verification pipeline.
- Android release metadata: versionName `1.2.9`, versionCode `25`.

## Verification gates
- Supabase migration parity and duplicate-version checks
- Route and import validation
- Mobile and offline readiness checks
- Project integrity validation
- ESLint and TypeScript
- Unit and integration tests
- Production build
- Android signed APK/AAB verification

## Deployment
The release is built from the latest `main` after the Supabase reconciliation and admin publishing improvements.

## Notes
`pg_net` remains provider-managed in the public schema on this Supabase installation because the platform does not support moving the extension with `ALTER EXTENSION ... SET SCHEMA`. This is documented by reconciliation migrations and does not block application operation.
