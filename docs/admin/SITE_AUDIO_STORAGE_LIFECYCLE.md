# Site-audio upload and orphan-retention lifecycle

## Upload contract

1. The admin upload endpoint creates a server-only `site_audio_upload_intents` row before issuing a signed Storage upload URL.
2. The signed URL is limited to the Supabase Storage two-hour upload lifetime. The intent receives a cleanup deadline 24 hours after that expiry.
3. Metadata registration requires the same owner, path, MIME type, byte count, a still-valid intent, and an exact Storage object metadata match.
4. After the canonical `site_audio_assets` row is inserted, the intent is marked `registered`. If that final status update fails, the asset row remains authoritative and the retention command reconciles it rather than deleting it.

## Orphan reconciliation

`pnpm site-audio:cleanup` is report-only by default. It inspects only expired rows whose status is still `pending`, validates the server-generated owner/path format and MIME/size contract, and checks the canonical `site_audio_assets.storage_path` reference.

The manual-only `ZIKR Site-Audio Orphan Retention` workflow is restricted to `main`. An apply run requires all site-audio upload/registration writers to be paused and the exact typed confirmation:

`DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS`

For every candidate, the command rechecks the intent and metadata reference immediately before removing only that exact object path. It then lists the exact directory entry to verify absence before marking the intent `cleaned`. Missing objects are reconciled without a Storage delete. Metadata-mismatched objects are retained for manual review. More than 5,000 expired intents, malformed paths, lookup errors, and failed absence verification all stop the run.

## Audit restrictions

- The audit and CI tests never execute the cleanup command with `--apply`.
- Workflow logs use a truncated SHA-256 path fingerprint; raw owner UUIDs and uploaded filenames are not printed.
- The service-role credential is step-scoped to credential validation and the cleanup dry-run/apply steps, never dependency installation or tests.
- No production Storage object, audio asset, bucket, or database row was deleted by this repair.
- The migration is a pending PR migration; production application requires the normal owner review and protected release process.
- Do not dispatch the manual workflow until the dry-run output has been reviewed and all site-audio upload/registration writers can remain paused for the full apply window.
