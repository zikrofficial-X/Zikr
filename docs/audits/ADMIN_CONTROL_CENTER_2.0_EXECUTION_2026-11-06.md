# ZIKR Admin Control Center 2.0 — Execution Report

**Date:** 2026-11-06  
**Repository:** zikrofficial-X/Zikr  
**Baseline main SHA:** ef88272503c0766ba12e2da200306274dfb479a1  
**Execution branch:** codex/zikr-comprehensive-repair-admin-control-center-2026-11-06  
**Pull request:** https://github.com/zikrofficial-X/Zikr/pull/194

> This report distinguishes source changes, live read-only evidence, CI evidence and release acceptance. A source change is not considered production-complete until the matching release SHA is deployed and verified.

## 1. Baseline and live evidence

- GitHub repository and default branch verified. Baseline was pinned before source changes.
- Supabase project ymxdswkaxafakugktsim is active on PostgreSQL 17.11.
- Vercel project zikr is connected to the production domain zikrmediaofficial.vercel.app. Its latest inspected production deployment was d80a61aeb161da937718ac2ba594835f516475e3, behind the inspected main SHA. Automatic Git deployments are disabled; production release is controlled by the manual workflow.
- Runtime logs reported column pinned_messages.is_active does not exist for /admin/content and /admin/content.rsc.
- The live public.pinned_messages contract is: id, title, body, cta_label, cta_href, published, created_at, updated_at. It has no is_active, priority, or type column. The table had zero rows when inspected.
- RLS is enabled on the inspected Admin/security/queue tables. The role-assignment table's direct write policies are restricted to super_admin; the social publish queue has explicit admin/super-admin/social-manager policies.
- Migration inventory contained 392 applied versions and no duplicate migration versions. Repeated descriptive names exist in historical seed migrations; no history was deleted or rewritten.
- Security Advisor surfaced disabled leaked-password protection and an RLS-enabled youtube_sync_state table with no policies. The latter currently fails closed. Performance Advisor surfaced 62 unused-index observations. No policy or index was weakened/dropped.
- Read-only queue snapshot: 73 queued, 3 partial, 407 published; 483 video-generation requests completed. 64 queued rows have no scheduled_at; the worker explicitly selects scheduled_at.is.null as eligible, so these rows were not changed. The 3 partial rows each have a successful YouTube remote ID and a Facebook Reels provider-cooldown deferral; attempts remain at zero and a next-allowed time is persisted.

## 2. Admin API route / permission inventory

The inspected source contains 22 API route handlers. Route-level authorization was checked in source; action-specific permissions are noted separately.

| API route | HTTP methods | Server permission |
|---|---|---|
| /api/admin/analytics | GET | analytics.read |
| /api/admin/cloudinary/image | GET, POST | media.manage |
| /api/admin/content | GET | content.manage |
| /api/admin/media | GET, POST, PATCH | media.manage |
| /api/admin/overview | GET | dashboard.view |
| /api/admin/page-view | POST | analytics.read |
| /api/admin/sections | GET, POST | sections.manage |
| /api/admin/site-audio | GET, POST, PATCH, DELETE | audio.manage |
| /api/admin/site-audio/upload | POST | audio.manage |
| /api/admin/social/facebook/callback | GET | social.manage |
| /api/admin/social/facebook/connect | GET | social.manage |
| /api/admin/social | GET, POST | social.manage; queue retry/worker actions additionally require social.publish |
| /api/admin/video-generation/narration-upload | POST | video.manage |
| /api/admin/video-generation | GET, PATCH, DELETE | GET/PATCH: video.manage; DELETE: video.delete; retry_publish PATCH action additionally requires social.publish |
| /api/admin/video-generation/sources | GET | video.manage |
| /api/admin/videos/[id]/retry | POST | video.manage |
| /api/admin/videos/[id] | GET, PATCH, DELETE | GET/PATCH: video.manage; DELETE: video.delete |
| /api/admin/videos/create | POST | video.manage |
| /api/admin/videos | GET | video.manage |
| /api/admin/videos/upload | GET, POST | video.manage |
| /api/admin/youtube-facebook/register-media | POST | media.manage |
| /api/admin/youtube-facebook/upload-url | POST | media.manage |

### Server Actions included in the guard audit

The Admin source includes server-action modules for Android release, video deletion, user-role changes, Kids content, release management, content publish/schedule/delete, SEO settings, knowledge records, category changes, editorial review/publish, system settings/notifications, plus inline actions in Library, Battles and Prophets pages.

Sensitive actions use step-up authorization where currently implemented (including role changes, video deletion, content deletion, category changes and editorial review/publish). The API-guard verifier previously discovered only module-level "use server" files. The execution branch expands it to discover inline page actions too and isolate each action body before checking its guard. Full CI is required to accept the scanner change.

## 3. Changes on PR #194

1. Public pinned-message reads now select the live CTA/published fields and filter by published = true.
2. Admin content listing, publish/unpublish and delete guards now use published for pinned messages.
3. Scheduled content publishing now sets published = true for pinned messages.
4. Admin Video Factory publish retry now performs a second server-side social.publish check. video.manage alone cannot retry a social publish.
5. Admin governance checks now assert the canonical pinned-message schema/query contract and the video-manager/social-manager permission boundary.
6. Admin API guard verification now discovers inline server actions embedded in Admin pages as well as module-level server actions.

No production DDL, migration, queue mutation, post deletion, credential update, auto-publishing toggle or production deployment was performed as part of this PR.

## 4. Publishing policy decision remains open

The publisher workflow currently declares:
- SOCIAL_PUBLISH_ENABLED=true
- AUTO_VIDEO_PUBLISH_ENABLED=true
- AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL=false

The audit plan and older runbook/closeout material are not fully consistent about whether every generated video must pass a persisted human approval before posting. The current publisher still enforces completed-request and exact media URL integrity when approval is configured off, but skips the human QA checklist. Do not change the production policy until the owner policy is resolved; UI or route work must not silently turn public posting off or on.

## 5. Phase-gate status

| Phase | State | Remaining acceptance |
|---|---|---|
| 0 — Baseline freeze | **Captured** | Re-capture if main advances before final merge/release. |
| 1 — Routes, APIs, database, permissions | **In progress** | Run enhanced guard verifier; complete per-action/RPC/table/RLS mapping and role-by-role negative tests. |
| 2 — Navigation and organization | **Existing foundation verified** | Complete legacy-route usage classification, ownership cleanup, breadcrumb and mobile acceptance. Do not delete compatibility routes without usage evidence. |
| 3 — Approval / worker boundaries | **Partially implemented** | social.publish permission boundary fixed for publish retry. Resolve approval policy; add reviewer/source/media snapshot binding and enforce before claim and before provider calls. |
| 4 — Video Factory Studio | **Not implemented** | No template tables exist in production. Build immutable templates/versions, preview, QA, human approval, activation and audited rollback. |
| 5 — Analytics / observability | **Partially present** | Reconcile per-platform queue states, template/provider metrics, freshness and remote IDs; prove figures against source rows/provider reports. |
| 6 — Full QA | **Running / pending** | Full pnpm verify, browser tests for every role, mobile acceptance, controlled worker tests and migration replay evidence. |
| 7 — Preview and controlled release | **Not started** | Vercel Preview, approved release SHA, production smoke tests and first worker-cycle validation. |

## 6. Remaining production blockers

- The pinned-message and permission fixes must pass full CI, then be merged and deployed through the controlled release workflow.
- /admin/content must be smoke-tested with an authenticated Admin session after deployment; verify listing, toggle, schedule and delete protections without deleting production content.
- Complete negative authorization tests for every role and sensitive action, especially OAuth, upload, role changes, deletion and publish retries.
- Resolve whether the owner intends unattended video publishing or mandatory human QA approval. Current production settings are intentionally unchanged.
- Enable Supabase leaked-password protection through the Auth dashboard, then rerun Security Advisor.
- Design and implement the data-backed Template Studio; the current page is only a static SVG library.
- Reconcile and surface the 3 cooldown-deferred partial posts; do not retry already-successful YouTube targets.
- Investigate intermittent upstream fetch failed logs and analytics AbortError separately; do not suppress real failures with fabricated metrics.
- Complete authenticated browser/mobile tests and production release verification. Static checks alone are insufficient.

## 7. Safety / change controls

- Do not delete or bulk-requeue live social items as part of an Admin UI change.
- Preserve successful per-platform remote IDs and idempotency.
- Keep GitHub Actions as the canonical workers. Do not add duplicate Vercel/Supabase/CircleCI schedulers.
- Keep generated video bytes in Cloudinary; Supabase remains the queue/metadata/audit store.
- Do not weaken RLS or remove unused indexes without query evidence and backup.
- Keep all credentials server-side; never include provider tokens in logs or UI.
- Protect Quran/Hadith source provenance and Kids content safety.
