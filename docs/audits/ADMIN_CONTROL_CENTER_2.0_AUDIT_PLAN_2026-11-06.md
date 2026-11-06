# ZIKR Admin Control Center 2.0 — Audit & Implementation Plan

**Repository:** zikrofficial-X/Zikr  
**Base branch:** main  
**Audit date:** 2026-11-06  
**Status:** Baseline source inventory completed. This document does not claim browser or production acceptance.

## Executive summary

The repository already contains a substantial Admin architecture: five canonical navigation groups, role-based permission definitions, server-side page/API guards, a Video Factory hub, separate GitHub Actions workflows for video generation and social publishing, video QA contracts, and analytics. The next effort should consolidate and complete capabilities rather than replace working systems.

## Verified existing architecture

- Admin navigation: `src/features/admin/config/navigation.ts`
- Permission model: `src/features/admin/services/permissions.ts`
- Server-side profile and guards: `src/features/admin/services/admin.ts`
- Shared layout/sidebar: `src/app/admin/layout.tsx`, `src/features/admin/components/admin-sidebar.tsx`
- Video Factory hub: `/admin/video`
- Generation workflow: `.github/workflows/generate-ai-video.yml`
- Social publisher: `.github/workflows/publish-social.yml`
- Video factory contracts: `scripts/verify-admin-video-factory.mjs`
- Admin governance contracts: `scripts/verify-admin-governance.mjs`, `scripts/verify-admin-architecture.mjs`

Navigation domains: Operations and monitoring; Content and knowledge; Media/production/publishing; Kids; Growth and system.

## Findings and gaps

### P0 — Publishing approval policy conflict

The checked-in social publisher currently sets `SOCIAL_PUBLISH_ENABLED=true`, `AUTO_VIDEO_PUBLISH_ENABLED=true`, and `AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL=false`. The generation workflow uses `BACKGROUND_JOB_TARGET=videos` and `SOCIAL_PUBLISH_ENABLED=false`, maintaining separation of rendering and publishing.

However, `docs/background-jobs.md` describes publishing as disabled by default and requiring approved backlog, while TODO/closeout records say owner approval and automatic publishing were enabled. Resolve this against the owner's intended live policy. Do not silently toggle production publishing during the UI refactor.

### P1 — Video Factory modules are uneven in capability

- Template page is an 11-item static SVG catalog, not a live template editor or version manager.
- Script page is primarily an explanatory hub, not a script editing/approval workflow.
- Voice page displays profiles and environment configuration; full voice editing/preview has not been demonstrated.
- Visual provider page reads server configuration and does not allow browser-side configuration changes.
- QA page summarizes gates; it should expose per-request evidence and review decisions.
- Requests page has a feature client and should be retained and hardened.
- Social has its own page/client and should remain independently permissioned.

### P1 — Navigation and operating workflow

Some production operations are linked from multiple locations. Keep `/admin/video` as the canonical production hub, with child modules beneath it. Keep `/admin/social` independent; link to it from the hub without putting publishing controls inside the renderer.

### P1 — Analytics coverage

Platform analytics and video render metrics exist. Define a canonical metric dictionary with separate dimensions for content performance, video production, template performance, provider reliability/cost, social publishing per platform, and Admin operations. Never turn unavailable data into zero.

### P1 — Verification evidence

Contract scripts do not prove browser acceptance or successful real-world social publication. Require role-by-role E2E, workflow run evidence, queue transition evidence and provider publication IDs.

## Target Admin information architecture

1. **Overview:** dashboard, queues, automation/schedules, health/alerts, audit log, release center.
2. **Content:** content library/editorial workflow, trusted sources, categories/sections, search/indexing, knowledge, Prophets and Battles.
3. **Video production:** Video Factory overview, source selection/source-lock, script editor/review, voice profiles/preview, visual providers/fallback policy, Template Studio/version history, render queue/retries, QA evidence/human approval.
4. **Publishing — independent domain:** social queue, platform readiness, YouTube, Facebook/Reels, scheduling/rate limits, per-platform retry/remote IDs, publishing analytics.
5. **Media:** managed media library, storage lifecycle/retention, provenance.
6. **Audio:** Quran recordings, Adhan, TTS profiles, site audio/reminders.
7. **Kids:** content/games, levels/assets, child-safe analytics and review.
8. **Growth and system:** platform analytics, SEO, users/roles, security/settings, Android release operations.

Navigation must remain a single permission-filtered source of truth. Do not create a second route registry or duplicate pages.

## Target workflow boundaries

### Generation workflow

Owns only source-locked request seeding, generation, narration where allowed, FFmpeg render, technical QA, media storage, and enqueueing publication candidates.

### Review/approval

Owns human review state, rejection reason, approved source/media snapshot, reviewer identity/timestamp, and immutable audit event.

### Social publisher

Owns platform preflight, claiming eligible queue entries, publication, idempotency, bounded retries, remote IDs, and per-platform state. It must never render video.

Publishing eligibility must be derived from persisted approval records and a single canonical runtime policy. Workflow environment values must not bypass the policy.

## Template Studio requirements

- Data-backed templates with stable IDs and immutable versions.
- Name, category, aspect ratio, resolution, typography, safe zones, colors, motion preset, source-card layout, caption style, audio policy, enabled status, version and audit metadata.
- Preview rendering must use the same renderer/runtime as final output.
- Lifecycle: draft → preview → QA → approve → activate.
- Rollback to a previous active version.
- Never overwrite a version referenced by completed videos.
- Support 9:16, 1:1 and 16:9 where the renderer supports them.
- Per-template metrics: attempts, completions, failures, average render time, QA pass rate, publish rate, and platform views/engagement when available.

## Analytics requirements

- Exact queue counts, not sample-based approximations.
- Time-window filters.
- Source/category/template/provider/platform dimensions.
- Success/failure and retry rates.
- Render latency distributions and provider fallback frequency.
- Publish latency and remote IDs.
- Views/reach/engagement only when provider insights are genuinely available.
- Explicit data source, freshness timestamp and null for unavailable values.

## Security and permissions

- Video managers manage generation but cannot publish unless separately granted.
- Social managers can publish but cannot change trusted religious sources.
- Analysts are read-only.
- Destructive actions require separate permissions and confirmation.
- Sensitive changes write audit events.
- Role assignment remains protected by authoritative database/RPC policy.
- Service-role credentials never enter client bundles or browser APIs.

Extend and run the existing checks: `pnpm admin:rbac:check`, `pnpm admin:api:check`, `pnpm admin:architecture:check`, `pnpm admin:governance:check`, `pnpm admin:video:check`, `pnpm admin:health:check`, `pnpm video:factory:check`, `pnpm video:qa:check`, `pnpm social:publish:check`, `pnpm check`, and `pnpm lint`.

## Phased implementation and acceptance

### Phase 0 — Freeze and baseline

Capture main SHA, Admin routes/APIs, workflow configuration, DB schemas/migrations, and test baseline. No production workflow toggles. **Exit:** inventory and baseline are reproducible.

### Phase 1 — Route, permission and dependency audit

Detect orphan pages, duplicate links, legacy redirects, routes missing page/API guards, actions missing audit, service-role usage in route handlers, and discrepancies between code, docs and migrations. **Exit:** route-to-permission-to-API matrix plus retain/merge/retire decisions.

### Phase 2 — Information architecture

Reorder existing navigation and dashboards without changing URLs or removing working features. Add breadcrumbs and clear ownership labels. **Exit:** every Admin route has one canonical navigation owner; deep links still work.

### Phase 3 — Workflow separation and approval integrity

Resolve the publishing policy conflict. Persist human approval and enforce it server-side in the publisher. Add explicit per-platform states and idempotency. Preserve independent generation and publishing jobs. **Exit:** unapproved/rejected media cannot publish; retries do not duplicate posts; generation works while publishing is disabled.

### Phase 4 — Production workbench

Upgrade script/voice/visual modules into usable tools where safe. Implement Template Studio with immutable versions, previews, QA, approvals, activation and rollback. **Exit:** a new template can be previewed, approved and used by the renderer while existing versions remain reproducible.

### Phase 5 — Analytics

Unify metric definitions/read models and show filters, freshness and unavailable states. Add template/provider comparisons and platform-level publishing results. **Exit:** metrics reconcile with exact queue/remote data within documented freshness windows.

### Phase 6 — Full verification

Run unit/contract checks, TypeScript, lint, route checks, browser E2E for every role, mobile acceptance, and controlled production workflow validation. Do not publish public test posts without explicit approval. **Exit:** all release gates green with evidence linked to commit/PR.

### Phase 7 — Release

Create a focused feature branch and PR, deploy Preview, complete acceptance, merge only after checks, then run controlled production release with rollback instructions. **Exit:** deployed SHA matches approved SHA and production smoke passes.

## Safeguards

- Do not delete legacy pages, migrations, tables, functions, indexes, storage objects or queue records without dependency proof and backup.
- Do not add Vercel Cron, Supabase Cron or CircleCI workers for video/social; GitHub Actions remain canonical in the current architecture.
- Do not store generated video binaries in Supabase Storage; current runbook specifies Cloudinary for generated media and Supabase for metadata/queues.
- Do not expose provider secrets/tokens in Admin UI or logs.
- Do not claim browser or production acceptance from static scripts alone.

## Immediate priorities

1. Reconcile production auto-publish approval policy and conflicting runbook/closeout records.
2. Complete route/API/database dependency matrix.
3. Consolidate navigation duplication while preserving old URLs through redirects.
4. Enforce human approval between Video QA and social queue.
5. Implement Template Studio and versioned data model.
6. Upgrade analytics to template/provider/platform level with exact counts.
7. Run role-by-role E2E and controlled production acceptance.

## Audit limitations

This was a GitHub source-level audit. No authenticated browser session, live Supabase data inspection, GitHub Actions run execution, Vercel deployment validation, or actual social publication test was performed in this audit.