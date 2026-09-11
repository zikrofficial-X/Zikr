# ZIKR Admin 2.0 — Execution Blueprint

## Scope

This branch is the integration base for the Admin 2.0 program covering:

- Control Center / Dashboard
- Content Studio and approval workflows
- AI Video Studio
- Media management and QC
- YouTube + Facebook publishing
- Per-platform idempotent jobs and retries
- Scheduler / Calendar / Automation
- RBAC and permission matrix
- Security / Audit / System Health
- SEO / Analytics / Release Center
- Supabase migration and RLS safety

## Delivery rules

1. Preserve existing production data and public routes.
2. Prefer additive schema changes; never rename/drop live tables without a reviewed migration and data plan.
3. Every new mutation gets server-side permission enforcement and audit logging.
4. Every external publish job is idempotent and platform-specific.
5. A successful platform must never be republished merely because another platform failed.
6. Migrations must pass the repository migration validator before merge.
7. No feature is considered complete until TypeScript, lint, tests, build, migration checks, and relevant E2E smoke checks pass.
8. Secrets are never committed; provider health checks report configuration state without exposing credentials.

## Phases

### P0 — Foundation
- Normalize Admin navigation and route ownership.
- Introduce a single permission registry and server-side guards.
- Add/finish RBAC roles and permission assignments.
- Centralize Audit and System Health contracts.
- Normalize settings for worker and social publishing enablement.

### P0 — Content + Media
- Unify content lifecycle: draft → review → approved → scheduled → published.
- Complete Media Manager and orphan/duplicate checks.
- Add Content Calendar and Approval Center.

### P0 — AI Video
- AI Video Studio projects, scripts, scenes, assets, prompts, metadata.
- Provider abstraction for AI generation.
- Generation jobs with retry, progress, cancellation, and final asset verification.
- Captions, thumbnail metadata, and brand templates.

### P0 — Social Publishing
- YouTube and Facebook connector health checks.
- Central platform publishing jobs.
- Per-platform idempotency keys.
- Resumable upload where provider supports it.
- External processing verification before marking published.
- Partial-failure recovery targeting only failed platforms.

### P1 — Automation
- Scheduler, recurring automation rules, notifications, workflow history.
- Campaign templates for long-form + shorts + social variants.

### P1 — Growth / Operations
- SEO Center, Analytics Center, Release Center, GitHub/Vercel/Supabase health summaries.

### P0 — Final QA
- Full verification gate and production smoke test.
- Migration replay check.
- RLS/security audit.
- Admin E2E and social publish test with real credentials in CI/production-safe environment.

## Supabase migration policy

Migration filenames must remain globally ordered and unique. New migrations should be idempotent where practical and should explicitly handle policy replacement instead of creating duplicate policy definitions. The existing `scripts/validate-migrations.mjs` remains the pre-merge gate.

## Social publishing contract

Each job must track at least:

- contentId
- mediaId
- platform
- status
- attemptCount
- idempotencyKey
- externalId
- externalUrl
- scheduledAt
- startedAt
- completedAt
- lastError

A multi-platform publication is represented as independent child jobs under a single publication intent.

## Acceptance criteria

- No known TypeScript, lint, test, build, migration, RLS, route, import, or mobile verification failures.
- Admin mutations are protected server-side.
- YouTube/Facebook jobs are observable, retryable, and idempotent.
- Production credentials remain outside source control.
- Any provider-specific limitation is surfaced in Admin rather than silently treated as success.
