# ZIKR Automation Ownership — 2026-10-08

## Canonical ownership

| Layer | Responsibility | Canonical owner |
|---|---|---|
| GitHub Actions | PR/main source and architecture verification | `quality-gate.yml` |
| GitHub Actions | Recurring video generation | `generate-ai-video.yml` |
| GitHub Actions | Recurring YouTube/Facebook publishing | `publish-social.yml` |
| GitHub Actions | Controlled Vercel production deployment | `release-finalization.yml` |
| GitHub Actions | Post-deploy production smoke verification | `release-vercel.yml` |
| GitHub Actions | Android release tag/draft orchestration | `create-android-release-tag.yml` |
| GitHub Actions | Android asset verification/publishing | `publish-android-release-assets.yml` |
| GitHub Actions | CircleCI configuration validation | `circleci-config-validation.yml` |
| GitHub Actions | Supabase production health probe | `supabase-production-health.yml` |
| CircleCI | Production web application build + build/release documentation | `application-build-docs` |
| CircleCI | Release-only source verification | `source-verify` |
| CircleCI | Release-only Supabase gate | `supabase-production-gate` |
| CircleCI | Android compile/sign/build | `android-rebuild` |
| CircleCI | Recurring English article/Hadith sync | `scheduled-english-content-sync` |
| CircleCI | Manual security audit | `manual-security-audit` |
| Supabase pg_cron | Prayer notification scheduling | `zikr-prayer-push-dispatch` |
| Supabase pg_cron | Daily source verification | `zikr-source-verified-content-agent` |
| Supabase Edge Function | Prayer push planning/delivery | `prayer-notification-worker` |
| Supabase Edge Function | Source-verified ingestion | `source-verified-content-agent` |
| Supabase Edge Function | Authenticated Spiritual AI endpoint | `spiritual-ai` |
| Supabase Edge Function | Health endpoint | `health` |

## Explicit non-overlap rules

1. GitHub Actions is the only production scheduler for video generation and social publishing.
2. CircleCI must never execute `scripts/run-background-jobs.ts` for production video/social work.
3. Supabase pg_cron must never schedule production video generation or social publishing.
4. The video worker may enqueue `social_publish_queue` records but must not publish to external platforms.
5. The social publisher may publish queued videos but must not render videos.
6. GitHub Quality Gate uses `pnpm verify:pr`; application build certification belongs to CircleCI.
7. Vercel production deployment remains a controlled GitHub release; CircleCI does not deploy the web application.
8. The English sync remains a CircleCI recurring workload; the Supabase source agent is a separate source-ingestion workload and does not perform English translation.
9. Prayer scheduling exists only in Supabase pg_cron + `prayer-notification-worker`.
10. The legacy `sync-youtube-facebook` Edge Function and its production scheduler are retired.

## Queue ownership

| Queue/data path | Producer | Consumer |
|---|---|---|
| `video_generation_requests` | GitHub video worker / admin automation | GitHub video worker |
| `social_publish_queue` | GitHub video worker / admin workflows | GitHub social publisher |
| `content_agent_queue` | Supabase source-verified content agent | Editorial/application processing |
| `prayer_notification_deliveries` | Supabase prayer worker planning | Supabase prayer worker delivery |
| `social_sync_jobs` | Legacy/manual backfill tooling only | No active production scheduler |

## Retired or non-production paths

- Legacy CircleCI `background-jobs` production worker: retired.
- CircleCI recurring video schedule: retired.
- CircleCI recurring social publisher: retired.
- Vercel video cron: retired.
- Supabase `zikr-video-processing` cron: retired.
- Supabase `zikr-youtube-facebook-sync` cron: disabled/legacy and not part of the active publishing path.
- `supabase/functions/sync-youtube-facebook/index.ts`: removed from the runtime tree.

## Current production scheduler set

### GitHub Actions
- Video generation: `17 3,9,15,21 * * *` UTC.
- Social publishing: `*/15 * * * *`.

### CircleCI
- English content sync: `17 4 * * *` UTC.
- Build/release workflows are event-driven; they do not own video/social production.

### Supabase
- Prayer notification worker: `* * * * *`.
- Source-verified content agent: `0 3 * * *`.

No other production scheduler should be added for these workloads without first updating this ownership contract and the scheduler verification checks.
