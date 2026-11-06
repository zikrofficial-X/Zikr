# ZIKR Admin Control Center — Operational Closeout

**Baseline:** `c1600cecfe226e11df851f29a58d60c50677db97` (post-PR-208 merge)
**Scope:** Admin route/API security inventory, operational analytics, and release acceptance gates.

## Delivered in this closeout tranche
- PR #208 merged: canonical exact permission matrix for all 39 Admin API handlers, enforced by `scripts/verify-admin-api-guards.mjs`.
- Operational traffic/revenue dashboard work is consolidated from PRs #209/#210 into one follow-up branch.
- Social publishing and video generation metrics include exact counts and UTC time windows.
- Per-platform aggregation exposes counts only; no remote IDs or OAuth tokens.
- Bounded analytics reads must match the exact count and remain at or below the configured limit, otherwise report unavailable.
- Unit tests cover bounded-read completeness, platform aggregation, sensitive-field exclusion, and render-duration semantics.

## Explicitly out of scope for an automated closeout
- Production approval-policy changes without a confirmed business decision and persisted approval enforcement evidence.
- Destructive migrations, storage cleanup, route deletion, or deletion of old Admin implementations without dependency proof and backup.
- External OAuth reauthorization, Google Analytics property access, Facebook Page permissions, Monetag reporting access, and Android device acceptance.
- Branch protection/ruleset changes where the connected GitHub integration does not expose a verified write operation.

## Required remaining release gates
- Run the full PR quality workflow on the final branch head.
- Verify production migration/RLS state and browser-level tests per role.
- Verify persisted approval is checked both when queue items are claimed and immediately before the remote platform call.
- Run a Vercel Preview and production smoke test against the exact approved SHA.
- Close duplicate/superseded PRs and update the parent Admin/Owner readiness issues with evidence.

## Admin completion rule
Admin development is not considered fully closed until the security, approval, browser E2E, production smoke, and owner-operated external prerequisites above are evidenced. Static checks and successful CI alone are insufficient.
