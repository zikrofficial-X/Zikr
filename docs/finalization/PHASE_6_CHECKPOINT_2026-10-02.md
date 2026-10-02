# Phase 6 Checkpoint — Security Hardening
## ZIKR Finalization — 2026-10-02

### Status

**BLOCKED — core hardening completed; production/security gates remain open.**

### Completed

- [x] Supabase Security Advisor reviewed.
- [x] Current public/internal table grants audited.
- [x] Anonymous DML hardened across the current public schema.
- [x] Public contact insert preserved.
- [x] Internal server-only tables closed to `anon/authenticated`.
- [x] `youtube_sync_state` closed to client roles.
- [x] SECURITY DEFINER ACLs verified.
- [x] Existing public view `free_tier_statistics` verified as `security_invoker=true`.
- [x] Legacy kids-game privileged route repaired on the finalization branch.
- [x] Legacy unauthenticated health probe removed.
- [x] Security regression script added.
- [x] Security regression script included in PR/full verification.
- [x] Production migration applied and verified.
- [x] Repository/remote migration sets remain synchronized at 292 / 292.

### Open gates

#### Gate A — deploy the kids security hotfix

The repaired `submit-result` endpoint is on:

`audit/phase-0-1-finalization`

It must be promoted to `main` and production before the application-side security fix can be considered live.

#### Gate B — Auth leaked-password protection

Supabase Security Advisor still reports leaked-password protection disabled. The setting must be enabled in Supabase Auth security settings. Current Supabase documentation confirms this is configured at the project Auth-security level. citeturn830170search0

#### Gate C — future default privileges

The current public-schema default ACL still grants broad privileges to anonymous/authenticated roles for future objects. A direct attempt to alter those defaults through the available migration execution role was rejected with `permission denied to change default privileges`.

This requires owner-authorized database administration rather than another blind retry.

### Release rule

Do **not** advance the finalization roadmap to Phase 7 as a closed security phase until Gates A–C are either completed or explicitly accepted as tracked exceptions.
