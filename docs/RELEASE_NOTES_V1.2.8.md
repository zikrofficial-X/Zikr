# ZIKR v1.2.8

## Release scope

- Includes the current `main` production codebase and all fixes merged through the release branch base.
- Finalized Supabase migration-history reconciliation and removed duplicate legacy migration-version files from the active migration directory.
- Retains replay-safe, no-op reconciliation markers for legacy remote migration versions instead of re-running archived DDL.
- Includes the current offline/PWA route inventory, IndexedDB/Cache Storage flow, durable local preferences, and offline verification tooling.
- Includes current admin/security hardening and content-library safeguards already present on `main`.
- Keeps native YouTube → Facebook synchronization, retry, duplicate protection, media import, and post-publish media cleanup infrastructure.
- Facebook publishing remains dependent on a valid Page access token and an available source media file.

## Android

- Version name: `1.2.8`
- Version code: `24`
- Application ID: `com.zikr.app`

## Required verification

- `pnpm install --frozen-lockfile`
- `pnpm verify`
- Android signed APK/AAB build
- APK/AAB signature and application ID validation
- SHA256 checksum generation and verification
- Production deployment smoke test

## Release policy

This release must not be published until CI verification passes and the Android artifacts are generated from this exact release branch commit.
