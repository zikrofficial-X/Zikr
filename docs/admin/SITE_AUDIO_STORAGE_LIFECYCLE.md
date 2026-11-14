# Site-audio upload and orphan-retention lifecycle

## Upload contract

1. The admin upload endpoint creates a server-only `site_audio_upload_intents` row before issuing a signed Storage upload URL.
2. The signed URL is limited to the Supabase Storage two-hour upload lifetime. The intent receives a cleanup deadline 24 hours after that expiry.
3. Metadata registration requires the same owner, path, MIME type, byte count, a still-valid intent, and an exact Storage object metadata match.
4. The asset row is compare-and-set finalized only while the owner-matched intent is still `pending`. If the intent moved to `deleting` or the compare-and-set fails, the exact row created by that request is rolled back.

## Orphan reconciliation

`pnpm site-audio:cleanup` is report-only by default. It inspects expired `pending` and `deleting` intents plus detached `registered` intents (`asset_id IS NULL`), validates the server-generated owner/path format and MIME/size contract, and checks the canonical `site_audio_assets.storage_path` reference.

The manual-only `ZIKR Site-Audio Orphan Retention` workflow is restricted to `main`. An apply run requires all site-audio upload/registration writers to be paused and the exact typed confirmation:

`DELETE_UNREFERENCED_SITE_AUDIO_UPLOADS`

The delete API changes the intent to `deleting` before deleting its metadata row, so a concurrent upload registration cannot reuse the same session. The asset foreign key clears `asset_id` only after the row is deleted. For every candidate, the command rechecks the intent state and metadata reference immediately before removing only that exact object path. It then lists the exact directory entry to verify absence before marking the intent `cleaned`. Missing objects are reconciled without a Storage delete. Metadata-mismatched objects are retained for manual review. More than 5,000 expired intents, malformed paths, lookup errors, and failed absence verification all stop the run.

## Pause control is an operator attestation, not an application lock

`SITE_AUDIO_UPLOAD_WRITES_PAUSED=true` is passed to the cleanup process from a manual workflow input. It does not set a Vercel runtime variable, and the upload-URL, registration, asset-delete, and other asset-reference API handlers do not read this workflow variable. The checkbox therefore does **not** pause application writes by itself.

Before destructive apply, the owner must independently disable or maintenance-gate every site-audio upload, registration, deletion, and asset-reference writer, then verify that the pause remains active for the entire apply window. If that cannot be independently verified, keep the run dry-run only. Do not infer that selecting the workflow input pauses the application.

## Audit restrictions

- The audit and CI tests never execute the cleanup command with `--apply`.
- Workflow logs use a truncated SHA-256 path fingerprint; raw owner UUIDs and uploaded filenames are not printed.
- The service-role credential is step-scoped to credential validation and the cleanup dry-run/apply steps, never dependency installation or tests.
- No production Storage object, audio asset, bucket, or database row was deleted by this repair.
- The migration is a pending PR migration; production application requires the normal owner review and protected release process.
- Do not dispatch the manual workflow until the dry-run output has been reviewed and all site-audio upload/registration writers can remain paused for the full apply window.
