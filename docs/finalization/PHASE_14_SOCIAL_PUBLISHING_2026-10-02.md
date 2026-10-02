# Phase 14 — Social Publishing
## ZIKR Finalization — 2026-10-02

### Objective

Make YouTube/Facebook publishing idempotent, concurrency-safe, and independently controllable so a provider failure cannot cause duplicate publication or an uncontrolled retry loop.

### Live audit

Production `social_publish_queue` currently has:

- 40 `partial` rows.
- 40/40 have `metadata.authBlocked=true`.
- 40/40 already have successful YouTube publication metadata with a non-empty remote YouTube video ID.
- The remaining failure is Facebook / Facebook Reels authentication.
- 0 duplicate `automation_key` groups exist.
- The production Facebook Page access token is expired.

### Code changes

1. **Optimistic queue claiming**
   - Social queue claims match both status and `updated_at`.

2. **Per-platform idempotency**
   - Existing successful platform results are preserved in `metadata.platformResults`.
   - Retry processing excludes platforms that already have `ok=true` and a remote ID.

3. **Facebook emergency gate**
   - `SOCIAL_PUBLISH_FACEBOOK_ENABLED` is explicit opt-in and currently `false` in the autonomous worker.
   - YouTube remains independent.

4. **Admin auth-block recovery**
   - Admin retry logic now identifies Facebook auth-blocked platforms separately.
   - `retry all` no longer requeues a Facebook platform whose failure is known to be an expired/invalid OAuth credential.
   - If all remaining targets are already successfully published or permanently auth-blocked, the queue item can be resolved without another provider call.

5. **Publisher health visibility**
   - Admin Social API now reports YouTube configuration, Facebook enablement/credential presence, and the number of auth-blocked queue items.
   - Admin UI displays these states explicitly so an operator does not mistake a credential outage for a video-generation failure.

6. **Publisher boundary enforcement**
   - Direct Facebook and Facebook Reels publishing enforce the same feature gate as queue creation.

### Data safety

- No social queue rows were deleted or rewritten by Phase 14.
- No credentials were exposed, fabricated, or rotated.
- Successful YouTube publication remains preserved.

### Required external action

Production Facebook publishing requires a valid Meta Page access token. The current token is expired; it must be renewed in the configured secret store before setting `SOCIAL_PUBLISH_FACEBOOK_ENABLED=true`.

### Verification

`scripts/verify-social-publishing.mjs` now verifies the publisher contract, the Facebook gate, idempotency, and the Admin auth-block recovery path. `social:publish:check` is already registered in `verify:pr` and `verify`.

### Release gate

Phase 14 source implementation is complete. The remaining production blocker is the external Facebook credential. GitHub Actions PR results remain subject to the existing connector observability exception.
