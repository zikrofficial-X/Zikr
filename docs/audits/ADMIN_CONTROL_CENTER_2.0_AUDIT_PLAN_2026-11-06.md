# ZIKR Admin Control Center 2.0 — Full Inventory, Status & Improvement Plan

**Repository:** zikrofficial-X/Zikr  
**Branch:** `main`  
**Audit date:** 2026-11-06  
**Audited HEAD:** `cf67380709ff65d981649dbfc47e323589d025b5`  
**Scope:** source inventory, routes, APIs, Admin feature modules, workflows, migrations, roles, operational evidence.

> This is a source and GitHub metadata audit. It is not a live browser, live Supabase, Vercel production or external-provider acceptance run.

## 1. Executive state

At the audited HEAD, the repository contained 64 Admin page routes (including legacy and transition routes), 22 Admin API route handlers, 34 files under `src/features/admin/`, and 15 GitHub Actions workflow files. The code contains five canonical navigation groups, role-based permissions, server-side page/API guards, a Video Factory hub, and separate generation/publishing workflows. These are inventory counts, not evidence that every page or API has passed browser acceptance.

## 2. Route inventory and grouping

| Domain | Page routes | Assessment |
|---|---:|---|
| Operations and monitoring | 9 | Core structure exists; consolidate overlapping controls/alerts/notifications/queues |
| Content and knowledge | 10 | Structure exists; validate editorial and data workflows |
| Video and video factory | 23 | Largest refactor scope; includes legacy/transition routes |
| Social publishing | 2 | Separate module; keep independent from rendering |
| Media and audio | 7 | Review duplicate site-audio route ownership |
| Kids | 6 | Structure exists; educator/device acceptance remains open |
| Growth and system | 7 | Structure exists; verify sensitive actions and analytics |
| **Total** | **64** | Includes legacy/redirect routes |

### Operations routes
`/admin`, `/admin/queues`, `/admin/automation`, `/admin/health`, `/admin/notifications`, `/admin/alerts`, `/admin/audit`, `/admin/release`, `/admin/control`.

### Content and knowledge
`/admin/content`, `/admin/library`, `/admin/sources`, `/admin/editorial`, `/admin/knowledge`, `/admin/prophets`, `/admin/battles`, `/admin/categories`, `/admin/sections`, `/admin/search`.

### Canonical video production family
`/admin/video`, `/admin/video/studio`, `/admin/video/studio/curated`, `/admin/video/sources`, `/admin/video/scripts`, `/admin/video/voices`, `/admin/video/visuals`, `/admin/video/templates`, `/admin/video/qa`, `/admin/video/requests`.

Additional routes inventoried under `ai-video`, `video-factory`, and `videos` must be classified individually as active, redirect, compatibility, or retired-after-proof. Do not delete them because a canonical family exists.

### Social
`/admin/social`, `/admin/social/youtube-import`.

### Media and audio
`/admin/media`, `/admin/audio`, `/admin/audio/adhan`, `/admin/audio/quran`, `/admin/audio/tts`, `/admin/audio/site-audio`, `/admin/site-audio`.

The two site-audio routes require ownership/redirect review. Do not merge until their differences and callers are mapped.

### Kids
`/admin/kids`, `/admin/kids/content`, `/admin/kids/games`, `/admin/kids/levels`, `/admin/kids/assets`, `/admin/kids/analytics`.

### Growth and system
`/admin/analytics`, `/admin/users`, `/admin/security`, `/admin/security/step-up`, `/admin/seo`, `/admin/android`, `/admin/settings`.

## 3. Admin feature architecture

Important files:
- `src/features/admin/config/navigation.ts` — canonical page navigation and required permission.
- `src/features/admin/config/modules.ts` — module catalog; compare with navigation and page tree to prevent parallel registries drifting.
- `src/features/admin/services/permissions.ts` — role/permission matrix.
- `src/features/admin/services/admin.ts` — current profile and server/API authorization helpers.
- `src/app/admin/layout.tsx` — shared layout and role-filtered navigation.
- `src/features/admin/components/admin-sidebar.tsx` — desktop/mobile navigation.
- `src/features/admin/components/admin-command-palette.tsx` — command/navigation palette.
- `src/features/admin/components/admin-module-directory.tsx` — searchable module directory.
- `src/features/admin/services/platform.ts` — operational overview/snapshot.
- `src/features/admin/services/analytics.ts` — platform analytics and video render metrics.
- `src/features/admin/services/audit.ts` — audit functionality.
- `src/features/admin/services/security.ts` — security helpers.
- `src/features/admin/video-requests/components/admin-video-requests-client.tsx` — queue UI.
- `src/features/admin/video-studio/components/admin-video-studio-client.tsx` — studio UI.

The current architecture already has searchable navigation, role filtering, module-directory behavior, breadcrumbs and a command palette. Improve consistency and ownership; do not add another navigation framework.

## 4. Permission model

Roles found in source: `super_admin`, `admin`, `content_manager`, `editor`, `video_manager`, `social_manager`, `moderator`, `seo_manager`, `analyst`, `support`, and `user`.

Important permissions include `admin.access`, `dashboard.view`, `content.manage`, `content.publish`, `content.delete`, `library.manage`, `sources.manage`, `knowledge.manage`, `video.manage`, `video.delete`, `social.manage`, `social.publish`, `media.manage`, `audio.manage`, `kids.manage`, `analytics.read`, `audit.read`, `users.read`, `users.roles`, `sections.manage`, `settings.manage`, `security.manage`, `notifications.manage`, `release.manage`, `system.manage`, and `android.manage`.

Page guards and API guard helpers exist. Complete proof still requires mapping every route handler, server action, database RPC and destructive action to the narrowest permission and RLS policy. Hiding a navigation item is not an authorization boundary.

Required behavior: video managers manage generation but cannot publish unless separately granted; social managers publish but cannot alter trusted religious sources; analysts are read-only; support cannot escalate roles; highest-role assignment remains protected by an atomic server-side/database path.

## 5. Admin API inventory

There are 22 route handlers at the audited HEAD:
- `/api/admin/analytics`
- `/api/admin/cloudinary/image`
- `/api/admin/content`
- `/api/admin/media`
- `/api/admin/overview`
- `/api/admin/page-view`
- `/api/admin/sections`
- `/api/admin/site-audio`
- `/api/admin/site-audio/upload`
- `/api/admin/social/facebook/callback`
- `/api/admin/social/facebook/connect`
- `/api/admin/social`
- `/api/admin/video-generation/narration-upload`
- `/api/admin/video-generation`
- `/api/admin/video-generation/sources`
- `/api/admin/videos/[id]/retry`
- `/api/admin/videos/[id]`
- `/api/admin/videos/create`
- `/api/admin/videos`
- `/api/admin/videos/upload`
- `/api/admin/youtube-facebook/register-media`
- `/api/admin/youtube-facebook/upload-url`

For each HTTP method, map guard, validation, ownership, rate limits, optimistic concurrency, audit event, tables/RPCs called, storage provider and failure codes. OAuth callbacks and uploads require dedicated security review.

## 6. Video Factory — current state and gaps

Existing modules: Sources (source-locked inputs); Scripts (currently primarily informational/guardrail view); Voices (profile catalog and environment-derived configuration display); Visuals (provider availability/order/safety policy and no browser-side secret mutation); Templates (11 static SVG assets: 7 general + 4 kids; catalog explicitly is not a live editor); QA (technical gate summary needing per-request evidence and human review); Requests (feature queue client to preserve); Studio (source/request creation).

Target lifecycle: `source selected → source verified/locked → script/caption generated → voice/render plan → template preview → render → automated QA → human review → approved candidate → social queue → per-platform publish → metrics`.

Rendering must never publish. The social publisher must never render. Review state must be durable and server-enforced.

### Template Studio requirements
- Data-backed templates with stable IDs and immutable versions.
- Fields: name, content category, aspect ratio, output resolution, fonts, safe areas, color scheme, transitions/motion, captions, source card, audio policy, enabled state and audit metadata.
- Draft → preview → QA → human approval → activation.
- Preview uses the production renderer and same input contract.
- Existing versions stay immutable if referenced by completed videos.
- Explicit audited rollback.
- Per-template attempts, success/failure, QA pass, average render time and publish performance where platform data exists.

### Script and voice workbench
- Keep religious source text immutable and source-locked.
- Separate sourced religious text from optional narration, explanation, title and social caption.
- Script editor shows provenance and text differences.
- Voice preview/test synthesis is bounded and non-publishing.
- Quran audio remains human/verified recording; no synthetic substitution.
- Profile changes require audit and compatibility checks.

### Visual provider controls
- Credentials remain server-side.
- Show provider order, enablement, free-only policy, quotas, timeout, fallback and recent health with freshness.
- Changes use validated server-side settings, not direct process-environment mutation.
- Provide circuit-breaker state and dry-run before activation.

## 7. Generation and publishing separation

Canonical generation workflow: `.github/workflows/generate-ai-video.yml`.
Canonical publishing workflow: `.github/workflows/publish-social.yml`.

Generation owns source-locked request seeding, generation, permitted narration, FFmpeg rendering, technical QA, media storage and enqueueing candidates. It uses a video-only worker target and keeps direct social publishing off.

Publishing owns platform preflight, queue claims, publication, idempotency, bounded retries, remote IDs and per-platform state. It consumes the queue and never renders media.

### P0 policy conflict
The inspected publisher workflow sets `SOCIAL_PUBLISH_ENABLED=true`, `AUTO_VIDEO_PUBLISH_ENABLED=true`, and `AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL=false`. The generation workflow sets `SOCIAL_PUBLISH_ENABLED=false` and a generation-only target. `docs/background-jobs.md` describes publishing as disabled by default and asks for backlog review before enabling, while TODO/closeout notes say owner approval and automatic publishing were enabled on 2026-11-01. Resolve the policy against the owner's current desired behavior. No production toggle was changed by this audit.

Approval must be persisted and enforced by the publisher using source/media snapshot and approval record. A workflow environment variable must not be the approval source. Rejected, changed or unreviewed media must fail closed.

## 8. Analytics design

Existing platform analytics and video render metrics should be unified at the presentation/read-model level, without conflating unlike measures.

Required dimensions: content views and top content; production request/completion/failure/retry and render latency; template attempts/QA/publish rate; provider attempts/fallback/reliability/quota where measurable; social per-platform queue/published/partial/failed/deferred/remote IDs and provider-supported views/reach/engagement; admin page/action/audit trends.

Requirements: exact queue counts; time window and timezone; source/freshness timestamp; null remains distinct from zero; cached analytics distinguished from live queue counters; role-scoped drilldown; no inferred views from publish success.

## 9. Database and migration audit scope

The repository has extensive migration families for Admin audit/RBAC/RLS, video automation/queues, social queue/OAuth/cooldowns, analytics, queue observability and storage retention. Repeated dated migrations with overlapping purpose are a reason to run migration history reconciliation, duplicate detection, replay and schema-contract validation; they are not proof the production schema is broken.

Do not drop tables, policies, RPCs, indexes, functions, storage objects or queue rows until a dependency map and verified backup exist. A migration file in Git is not proof it has applied successfully in production.

## 10. GitHub Actions operational evidence

At audit time, the latest Quality Gate push for audited main HEAD was still in progress; the preceding main Quality Gate run succeeded. Recent Social Publisher runs and AI Video Worker runs included successful workflow conclusions. A green workflow is not proof of a successful remote post: verify job summaries, queue status, provider response, remote platform ID, media URL and absence of duplicate posts.

Run links: Quality Gate in progress `https://github.com/zikrofficial-X/Zikr/actions/runs/42149721141`; previous main Quality Gate success `https://github.com/zikrofficial-X/Zikr/actions/runs/42147350256`; scheduled Social Publisher run `https://github.com/zikrofficial-X/Zikr/actions/runs/42148294759`.

## 11. Findings ranked by priority

### P0 — Before production policy changes
1. Resolve auto-publish/approval contradiction between workflow env and runbook/closeout.
2. Prove publisher enforces persisted approval server-side and cannot be bypassed.
3. Complete route/API/action permission matrix, especially publish, retry, delete, role change, settings and OAuth.
4. Verify live DB migration state and RLS before schema modifications.

### P1 — Core product improvements
5. Canonical route registry and classification for legacy `ai-video`, `video-factory`, `videos`, and duplicate site-audio paths.
6. Template Studio with immutable versions, renderer preview, QA, approval and rollback.
7. Turn script/voice/visual/QA display surfaces into operational workbenches.
8. Unify analytics with exact counts and honest freshness/unavailable semantics.
9. Make queue recovery and per-platform publishing auditable and drillable.
10. Complete browser E2E for each role and sensitive action.

### P2 — Usability and efficiency
11. Simplify operations dashboard and reduce duplicate quick links.
12. Consistent breadcrumbs, page titles and ownership labels.
13. Standardize filtering, sorting, pagination and loading/empty/error states.
14. Mobile-first responsive behavior for every Admin page.
15. Consolidate site-audio ownership and media storage visibility.
16. Keep favorites/recents and command palette permission-filtered.

## 12. Target information architecture

1. Overview: dashboard, alerts, health, queues, audit, release.
2. Content: library, trusted sources, editor, categories/sections, knowledge.
3. Production: Video Factory source/script/voice/visual/template/QA/requests/studio.
4. Publishing: separate social center, platforms, approvals, schedules, retries, insights.
5. Media & Audio: media library, storage lifecycle, Quran, Adhan, TTS and reminders.
6. Kids: content, games, levels, assets, educator review and analytics.
7. Growth & System: platform analytics, SEO, users/roles, security, settings and Android.

Navigation must have one source of truth. Old routes remain compatible redirects until usage and inbound links are understood.

## 13. Implementation plan and phase gates

### Phase 0 — Baseline freeze
Pin main SHA and workflow/environment config; capture route/API/DB/workflow/test inventory; run baseline checks without production changes; record release, backup and rollback constraints. **Exit:** reproducible baseline.

### Phase 1 — Route/API/database audit
Classify all 64 routes; inspect all 22 APIs; map server actions/RPCs to permission and audit; map API to tables/RLS/storage/migrations; compare module catalog/navigation/routes; test role authorization. **Exit:** route-role-API-table matrix and keep/merge/redirect decisions.

### Phase 2 — Navigation and organization
Group existing pages into target architecture; remove duplicate visible entries, not compatibility routes; permission-filter quick links; add consistent breadcrumbs and mobile layout. **Exit:** single canonical navigation owner per route and old links still resolve.

### Phase 3 — Approval and worker boundary hardening
Resolve publish policy; add durable approval with reviewer/time/source-media hash/rejection reason; enforce approval on queue claim and immediately before platform call; retain idempotency, per-platform state, bounded retries, locks and cooldowns. **Exit:** unapproved media cannot post and retries do not duplicate.

### Phase 4 — Video Factory Studio
Implement immutable template versions, renderer-backed preview, QA evidence and rollback; source-provenance script editor; bounded voice preview; validated provider controls; preserve separate publish permission. **Exit:** test video passes source lock, preview, render, QA and human review, and can be queued without automatic public posting.

### Phase 5 — Analytics and observability
Canonical metric dictionary/read model; exact time-windowed counts; template/provider/platform dimensions; remote IDs; freshness; drilldown. **Exit:** metrics reconcile with operational rows and provider reports.

### Phase 6 — Full QA
Unit/contract checks, TypeScript, ESLint, build, all-role browser E2E, mobile acceptance, storage/migration replay and controlled worker tests. No public test post without explicit approval. **Exit:** reproducible evidence for all gates.

### Phase 7 — Preview and controlled release
Focused branch and PR; CI/review; Vercel Preview; verify release SHA and rollback; production smoke and first worker-cycle checks. **Exit:** deployed SHA equals approved SHA, workers do not overlap and production evidence is recorded.

## 14. Existing checks to run

`pnpm admin:rbac:check`, `pnpm admin:api:check`, `pnpm admin:architecture:check`, `pnpm admin:governance:check`, `pnpm admin:video:check`, `pnpm admin:health:check`, `pnpm video:factory:check`, `pnpm video:qa:check`, `pnpm social:publish:check`, `pnpm check`, `pnpm lint`, and `pnpm verify:pr` where CI capacity and required credentials allow.

Static checks must be supplemented by browser E2E, real DB checks and controlled provider tests.

## 15. Safety constraints

- Keep GitHub Actions as canonical video and social workers; no duplicate Vercel/Supabase/CircleCI schedulers.
- Generated media continues to use Cloudinary as specified in the current runbook; Supabase stores queue/metadata/audit state.
- Keep secrets server-side and never log OAuth/page tokens.
- No mass queue edits, media deletion, route deletion or migration retirement without backup and dependency proof.
- Do not change live auto-publish policy as a side effect of UI work.
- Preserve religious source integrity and child-safety controls.
- Distinguish source implementation from operational acceptance.

## 16. Immediate next execution order

1. Inspect running main Quality Gate and confirm current HEAD.
2. Update issue checklist with exact route/API/DB inventory.
3. Complete page/API guard matrix; inspect all 22 handlers and server actions.
4. Resolve publishing approval policy and encode server-side enforcement.
5. Classify legacy routes and consolidate navigation safely.
6. Build Template Studio data model/API/UI/tests.
7. Complete analytics and queue drilldown.
8. Finish role-by-role browser and mobile E2E.
9. Ship through Preview and controlled production release.

## 17. Audit limitations

No authenticated browser test, live Supabase query, Vercel production inspection or external platform posting validation was performed. These remain explicit acceptance tasks, not assumed successes.