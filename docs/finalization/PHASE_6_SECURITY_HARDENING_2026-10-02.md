# Phase 6 — Security Hardening
## ZIKR Finalization — 2026-10-02

### Scope

Security hardening covered:

- Supabase Security Advisor findings;
- public Data API grants;
- internal/server-only table exposure;
- `SECURITY DEFINER` function execution ACLs;
- public views;
- Storage bucket exposure;
- kids-game privileged API paths;
- repository security regression checks.

Current Supabase security guidance was checked against the current official documentation. Supabase documents that Data API exposure is controlled by both grants and RLS, that existing projects can have broad default table privileges, and that functions require explicit EXECUTE control. Supabase also recommends `security_invoker` for views where underlying RLS must apply. citeturn830170search2turn830170search3turn830170search10

### 1. Production security findings before hardening

Security Advisor reported:

- 4 INFO findings for RLS-enabled server/internal tables with no policies:
  - `admin_audit_log`
  - `admin_settings`
  - `content_revisions`
  - `video_automation_runs`
- 1 WARN:
  - Supabase Auth leaked-password protection disabled.

The four tables were confirmed by repository usage to be server/worker-only. Adding client policies merely to suppress the linter would have broadened their API surface unnecessarily.

### 2. Database privilege hardening applied to production

Migration applied:

`20261002073929_phase6_security_hardening_20261002`

Repository file:

`supabase/migrations/20261002073929_phase6_security_hardening_20261002.sql`

Changes:

1. Revoked anonymous `INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER` privileges across the current `public` schema.
2. Re-granted only the anonymous `INSERT` privilege required by `public.contacts`.
3. Revoked all `anon/authenticated` privileges from:
   - `admin_audit_log`
   - `admin_settings`
   - `content_revisions`
   - `video_automation_runs`
   - `youtube_sync_state`

The service-role grants remain available for the existing server and worker paths.

This follows Supabase's current guidance to use both privileges and RLS as separate access controls and to grant each role only the operations it actually needs. citeturn830170search2turn830170search3

### 3. Production verification

Post-migration verification confirmed:

- `admin_audit_log`: service-role only
- `admin_settings`: service-role only
- `content_revisions`: service-role only
- `video_automation_runs`: service-role only
- `youtube_sync_state`: service-role only
- `contacts`: anonymous `INSERT + SELECT` remains available
- all current `SECURITY DEFINER` functions have no `anon` or `authenticated` EXECUTE grant

The production view `free_tier_statistics` is already configured with `security_invoker=true`, which is consistent with Supabase's current view-security guidance. citeturn830170search3turn830170search5

### 4. SECURITY DEFINER review

All current public `SECURITY DEFINER` functions were enumerated.

Confirmed protected functions include:

- `get_push_scheduler_secret()`
- `get_push_vapid_bundle()`
- `ensure_push_vapid_bundle(jsonb)`
- `kids_record_game_result_internal(...)`
- `kids_record_game_result(...)`
- `plan_background_reminder_deliveries(...)`
- `increment_kids_content_shares(text)`

Their current ACLs are restricted to `postgres`/service-role execution; `anon/authenticated` do not have EXECUTE.

Supabase's current function guidance states that `SECURITY DEFINER` functions require careful `search_path` handling and explicit EXECUTE restrictions. citeturn830170search4turn830170search10

### 5. Kids-game API security repair

A legacy endpoint was found at:

`src/app/api/kids/games/submit-result/route.ts`

The old implementation:

- created a service-role Supabase client directly;
- inserted results directly;
- directly updated progress;
- directly created achievements;
- contained `@ts-nocheck`;
- exposed an unauthenticated GET database health probe.

That code path was replaced on the audit branch.

New design:

- Bearer token is verified with the public Supabase client;
- payload is normalized and validated by the canonical kids-game validation layer;
- privileged persistence is centralized in `recordKidsGameResultForUser()`;
- final persistence uses the protected `kids_record_game_result_internal` RPC;
- the old route is explicitly deprecated;
- the old unauthenticated health probe now returns HTTP 405.

A repository security check was added:

`scripts/verify-security-hardening.mjs`

and integrated into both:

- `pnpm verify:pr`
- `pnpm verify`

### 6. Storage review

Current production buckets were reviewed:

- public: `avatars`, `media`, `public-assets`, `quran-audio`, `site-audio`, `videos`
- private: `audio`, `documents`

No production bucket was made public or private during this phase. The phase did not change existing content-delivery behavior.

### 7. Remaining Security Advisor WARN

Supabase still reports:

`auth_leaked_password_protection`

This is an Auth project setting rather than a SQL/schema defect. Current Supabase documentation places leaked-password protection under the project's Auth password-security settings and states that it uses the HaveIBeenPwned Pwned Passwords API; the feature is available on Pro and above. citeturn830170search0

The connected Supabase interface available to this execution does not expose an authenticated Auth-settings mutation tool, so this setting was **not falsely marked as completed**.

### 8. Remaining default-privilege issue

The live database still has broad `pg_default_acl` entries for `postgres`/public and `supabase_admin`/public:

- new tables default to grants for `anon`, `authenticated`, and `service_role`;
- new functions default to EXECUTE for `anon`, `authenticated`, and `service_role`.

The current production objects were hardened, but changing these default-privilege records requires a role with permission to alter the defaults. The connected migration execution role returned:

`permission denied to change default privileges`

No unsafe retry was performed.

This remains an open hardening item because Supabase documents that default privileges affect how new public objects become reachable through the Data API. citeturn830170search2turn830170search10

### 9. Production vs audit-branch state

The database privilege hardening migration is already applied to production.

The kids endpoint code hardening exists on:

`audit/phase-0-1-finalization`

and has **not** been promoted to `main`/Vercel during Phase 6.

Therefore the security code fix is verified in repository state but is not yet a production deployment change.

### Phase 6 conclusion

**Database hardening: complete and verified.**

**Repository security hardening: implemented and added to the verification pipeline.**

**Phase closure: BLOCKED until two remaining gates are satisfied:**

1. deploy the hardened kids-game endpoint from the audit branch;
2. enable Supabase leaked-password protection and address the default-privilege ownership limitation through an owner-authorized platform/SQL operation.

No secret values were exposed, rotated, or committed.
