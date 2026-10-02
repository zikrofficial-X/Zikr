# Phase 14 — Social Publishing
## ZIKR Finalization — 2026-10-02

### Objective

Make YouTube/Facebook publishing idempotent, concurrency-safe, and independently controllable so a provider failure cannot cause duplicate publication or block successful platforms.

### Live audit

Production `social_publish_queue` currently has:

- 40 `partial` rows.
- 40/40 have `metadata.authBlocked=true`.
- 40/40 already have successful YouTube publication metadata with a non-empty remote YouTube video ID.
- The remaining failure is Facebook / Facebook Reels authentication.
- 0 duplicate `automation_key` groups exist.

Observed live Facebook error:

`Error validating access token: Session has expired on Tuesday, 29-Sep-26 06:00:00 PDT`

The failure corresponds to Meta OAuth error code 190 / subcode 463 in the Facebook feed path.

### Code changes

1. **Optimistic queue claiming**
   - Social queue claim now matches both status and the row's current `updated_at`.
   - Two workers cannot safely claim the same row after one worker has already changed it.

2. **Per-platform idempotency**
   - Existing successful platform results are preserved in `metadata.platformResults`.
   - Retry processing excludes platforms whose previous result already has `ok=true` and a remote ID.
   - Therefore a Facebook retry does not re-upload an already-published YouTube video.

3. **Facebook emergency gate**
   - Added `SOCIAL_PUBLISH_FACEBOOK_ENABLED`.
   - Facebook is explicit opt-in and defaults to `false`.
   - The autonomous GitHub Actions worker currently sets it to `false` because the production Page token is expired.
   - YouTube remains independent and can continue publishing.

4. **Publisher boundary enforcement**
   - Direct Facebook and Facebook Reels publishing also enforce the same gate, not only queue creation.

5. **Existing idempotency preserved**
   - `social_publish_queue.automation_key` remains unique.
   - No duplicate automation groups are present in production.

### Data safety

- No social queue rows were deleted.
- Existing partial rows remain auditable and auth-blocked.
- No replacement Meta credential was invented or written.
- No already-successful YouTube result will be retried solely because Facebook remains blocked.

### Required external action

Production Facebook publishing requires a valid Meta Page access token. The current token is expired; it must be renewed in the configured secret store before setting `SOCIAL_PUBLISH_FACEBOOK_ENABLED=true`.

### Verification

Added `scripts/verify-social-publishing.mjs` and registered `social:publish:check` in `verify:pr` and `verify`.

### Release gate

The source and live-data Social Publishing contract is deterministic. GitHub Actions PR workflow results remain subject to the existing connector observability exception.
