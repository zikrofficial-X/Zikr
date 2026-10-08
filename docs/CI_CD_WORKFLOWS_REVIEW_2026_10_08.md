# ZIKR CI/CD Workflows — Reconciled 2026-10-08

## Canonical ownership

| Responsibility | Owner | Status |
|---|---|---|
| Pull request / main source verification | GitHub Actions — `ZIKR / Quality Gate` | Active |
| Controlled production deployment | GitHub Actions — `release-finalization.yml` | Active |
| Manual video dispatch | GitHub Actions — `generate-ai-video.yml` | Active |
| Recurring video generation | GitHub Actions — `generate-ai-video.yml` | Active |
| Recurring social publishing | GitHub Actions — `publish-social.yml` | Active |
| Recurring English content sync | CircleCI | Active |
| Application build/documentation artifact | CircleCI — `application-build-docs` | Active |
| Android release build/signing | CircleCI | Active |
| Minute-level prayer notifications | Supabase pg_cron | Active |
| Deployment target | Vercel project `zikr` | Active |

GitHub Actions owns the recurring production video and social schedules. CircleCI does not execute those queues. Supabase pg_cron owns the minute-level prayer worker. Vercel does not own production video/social cron scheduling.

## Current GitHub workflows

### `quality-gate.yml`
Canonical source gate.

- PRs run `pnpm verify:pr`.
- `main` runs the full `pnpm verify` gate.
- Production deployment is not triggered by a push.
- Timeout and concurrency protection are configured.

### `generate-ai-video.yml`
Canonical production video generation worker.

- Four scheduled runs/day plus deliberate manual dispatch.
- Main-only.
- Protected `production` environment.
- Explicit timeout and concurrency protection.
- Uses the canonical `scripts/run-background-jobs.ts` → `template-video-automation.ts` path.
- Social publishing is intentionally disabled in this worker; it queues completed video work for the dedicated publisher.

### `publish-social.yml`
Canonical production social publisher.

- Runs every 15 minutes plus manual dispatch.
- Main-only.
- Protected `production` environment.
- Reconciles completed videos into `social_publish_queue` and publishes pending YouTube/Facebook targets.

### `release-finalization.yml`
Canonical production release workflow.

1. Checkout exact `main` SHA.
2. Validate `PRODUCTION_RELEASE.flag`.
3. Run release contract.
4. Run verification gate.
5. Build with pinned Vercel CLI.
6. Deploy the prebuilt artifact to the canonical Vercel project.
7. Run production smoke verification.
8. Record release evidence.

### `release-vercel.yml`
This file is no longer a deployment owner. It is the production smoke-verification workflow and must remain manual-only.

## CircleCI ownership

CircleCI configuration currently owns:

- `application-build-docs` web application build and release/documentation artifacts;
- scheduled English content sync;
- Android release execution;
- Supabase production gates;
- manual security audit.

There is no production video/social worker in CircleCI.

## Production scheduling

Current scheduled responsibilities:

- Video generation: `03:17, 09:17, 15:17, 21:17 UTC` via GitHub Actions.
- Social publishing: every 15 minutes via GitHub Actions.
- English content: `04:17 UTC` via CircleCI.
- Prayer notification worker: Supabase pg_cron every minute.

No Vercel cron is required for these workloads.

## Verification contracts

The repository already includes dedicated gates for:

- CI architecture;
- scheduler ownership;
- database migration chain;
- schema contract;
- video contract;
- Quran canonicalization/offline data;
- voice/video factory;
- social publishing;
- admin architecture/pages;
- security/hygiene;
- platform routes;
- TypeScript/lint/build.

## 2026-10-08 repair results

Completed in the controlled repair branch:

- Restored the missing production admin rate-limit table/function contract.
- Removed the dead enhanced video worker rather than maintaining two competing queue implementations.
- Consolidated accidental duplicate public-read/admin-read policies for hadiths, scholars and stories.
- Reconciled repository audit inventory.

## Final gate

The repair branch is not considered release-complete until:

1. GitHub verification passes.
2. Migration count and remote history converge after the branch is merged/applied.
3. A production deployment is created from the exact intended `main` SHA.
4. Vercel reports `READY`.
5. The canonical domain smoke test passes.
6. Runtime telemetry remains clean after deployment.

No production promotion is inferred from a commit alone.
