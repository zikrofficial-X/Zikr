# ZIKR Finalization — Continuation Plan (Phases 16–23)
## 2026-10-02

This continuation starts after the verified Phase 15 merge into `main` (merge commit `8442b0c23dce9bddfd08a048583a01dadf850e76`).

## Closure rule

A phase is closed only when:
1. implementation is committed;
2. its dedicated verification gate passes;
3. repository-wide verification passes where applicable;
4. Supabase production health passes when the phase touches DB/runtime infrastructure;
5. no new unresolved blocker is carried forward without being documented.

## Phase 16 — Admin / Route / Release-Inventory Hardening
Scope:
- lock the current 103-page / 71-API route inventory;
- keep every Admin page behind a server-side permission guard;
- keep every Admin API behind scoped `requireAdminApi(permission)`;
- document the canonical Admin navigation and permission contract;
- remove baseline drift warnings.

Gate:
- `admin:architecture:check`
- `routes:check`
- `project:check`
- `verify:pr` / `verify`

## Phase 17 — Runtime-Optional Data Ownership
Scope:
- explicitly classify empty runtime-optional tables as ACTIVE, SOURCE-BACKED, or RETIRED;
- preserve generated Supabase types until the DB retirement stage;
- do not drop any table in this phase.

Current evidence:
- the targeted tables are empty and have no active `src/` runtime consumer in the repository scan;
- they remain schema/type history until a coordinated retirement migration.

Gate:
- lifecycle manifest;
- dependency scan;
- migration replay;
- source/type consistency check.

## Phase 18 — Coordinated Legacy DB Retirement
Scope:
- retire only coordinated legacy groups after dependency confirmation;
- preserve historical audit data by migrating the one live `admin_actions_audit` row into `admin_audit_events`;
- retire `admin_actions_audit`, `admin_audit_log`, `video_publishing_config`;
- retire `video_narrations` + `free_tier_usage` + `free_tier_statistics` + `track_free_tier_usage()` + legacy narration trigger/function;
- retire empty `game_graphics` and `kids_achievements_legacy_20261002`;
- do NOT delete `game_scenarios` in this phase because it contains 12 live rows and needs a content-owner decision.

Gate:
- Supabase development branch migration replay;
- production schema comparison;
- production migration apply;
- post-migration data/API smoke;
- repository verification.

## Phase 19 — Index / Performance Governance
Scope:
- review the remaining unused-index findings;
- remove only redundant indexes attached to retired objects or provably redundant definitions;
- preserve FK/unique/high-volume/query-critical indexes.

Gate:
- security/performance advisors;
- migration replay;
- application verification;
- production health.

## Phase 20 — Asset / Mobile Packaging Hygiene
Scope:
- inventory duplicated Quran/audio/offline assets across web, Android, iOS;
- prove runtime/native packaging references;
- deduplicate only where all consumers are covered;
- preserve offline capability and native packaging.

Gate:
- `offline:check`
- `mobile:check`
- `project:check`
- build/typecheck.

## Phase 21 — Test / QA Infrastructure
Scope:
- add the missing project test contract for the Kids/game layer;
- cover registry integrity, deterministic level generation, score/XP bounds, offline result payload validation and canonical content adapters;
- keep deterministic repository verification as the release baseline.

Gate:
- tests;
- `verify:pr`;
- lint;
- typecheck;
- build.

## Phase 22 — Production Release Closure
Scope:
- final full repository gate;
- Supabase production health;
- current production deployment verification;
- manual Vercel release of the verified `main` commit because automatic Git deployment is disabled;
- public route smoke checks;
- admin smoke;
- games smoke;
- video/social smoke;
- confirm Facebook remains disabled until valid Meta credentials are supplied.

Gate:
- Vercel READY deployment for the verified commit;
- production Supabase health;
- clean final quality gate.

## Phase 23 — Final Closure
Deliver:
- final phase ledger;
- open-exception ledger;
- production commit/deployment references;
- database migration/version ledger;
- rollback reference;
- final architecture/status summary.

A phase cannot be marked complete merely because its code exists. The gate result must be recorded.
