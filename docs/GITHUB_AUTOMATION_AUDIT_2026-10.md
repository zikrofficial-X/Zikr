# Historical snapshot — 2026-10-07

> This document records the automation state observed on 2026-10-07. It is retained for audit history only. The active CI/CD architecture for 2026-10-08 and later is documented in `docs/CI_CD_ARCHITECTURE_2026_10_08.md`. In particular, the current Admin Run Now dispatcher cadence is 30 minutes, and the canonical GitHub source check is `ZIKR / Quality Gate`.

- **Repository:** [zikr-org/Zikr](https://github.com/zikr-org/Zikr)
- **Branch:** `maintenance/consolidate-github-actions-2026-10`
- **Scope:** GitHub Actions, CircleCI source-verification overlap, automation secret scopes, recurring runner/API usage, and relevant content-sync scripts.

## Executive summary

The audit found unnecessary recurring runs, duplicated source checks, unbounded translation retries, an environment-secret scope mismatch, and production-secret jobs that lacked an explicit main-branch guard. The changes keep the distinct release, health-check, Android, video-dispatch, and manual recovery capabilities intact while reducing idle work and making failures observable.

No secret values were read, copied, changed, or written. The existing GitHub `production` environment already contains the required Supabase service-role, Gemini, YouTube, Facebook, and Vercel secret names and has no required-reviewer protection rule. Those jobs are now explicitly attached to that environment and restricted to `main`; the public canonical Supabase URL is configured directly rather than treated as a missing secret.

## Workflow inventory and disposition

| Workflow                             | Responsibility                                              | Audit disposition                                                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quality-gate.yml`                   | PR/main source verification                                 | Retained as the canonical source gate; existing PR verification includes route, localization, and kids-content checks.                             |
| `supabase-production-health.yml`     | Read-only production health probe                           | Retained; distinct from repository verification.                                                                                                   |
| `release-finalization.yml`           | Controlled Vercel production deployment                     | Retained; production job is explicitly restricted to `main`.                                                                                       |
| `release-vercel.yml`                 | Manual post-deploy production smoke verification            | Retained; complements deployment and is not a duplicate deployer.                                                                                  |
| `generate-ai-video.yml`              | Video generation and configured social queues               | Retained; no automatic source-push trigger, four scheduled runs/day, production environment and main-only guard.                                   |
| `urgent-video-dispatcher.yml`        | Lightweight admin Run Now poller                            | Retained; poll interval reduced to 15 minutes, production environment and main-only guard.                                                         |
| `english-content-sync.yml`           | Gemini article translations + canonical Hadith English sync | Consolidated to one daily runner/install, plus manual dispatch; bounded to five articles and 25 Hadith records by default. No source-push trigger. |
| `circleci-config-validation.yml`     | CircleCI configuration validation                           | Retained; runs only for relevant configuration changes/manual dispatch.                                                                            |
| `create-android-release-tag.yml`     | Controlled Android release tag/draft                        | Retained; distinct release stage.                                                                                                                  |
| `publish-android-release-assets.yml` | Verify and publish Android artifacts                        | Retained; job now skips ordinary main pushes and runs for a release tag or explicit release-state file change.                                     |
| `global-localization-verify.yml`     | Duplicate localization/route verification                   | Removed; same checks already run within `quality-gate.yml` (`pnpm verify:pr`).                                                                     |

CircleCI's unconditional `main-source-verification` workflow was removed. CircleCI remains available for tagged Android releases and opted-in/manual recovery, while GitHub Actions is the single automatic PR/main source-verification owner.

## Quota and runtime improvements

- **Video worker:** one hourly schedule (24 starts/day) became four paced runs/day (83% fewer schedule starts); the existing daily target of eight video requests is preserved. Code pushes no longer start production generation. Gemini visual planning now makes one request to the configured model; on API failure the existing deterministic video-template fallback is used, rather than trying another model. pnpm caching is enabled, Arabic TTS and the video client share one Python virtual environment, and redundant `apt-get update`/venv setup was removed.
- **Run Now dispatcher:** polling every five minutes (288 starts/day) became every fifteen minutes (96 starts/day), retaining a manual dispatch and a 15-minute response window.
- **English content:** four scheduled runs/day became one daily run. Article translation's ten-repeat loop was removed; article (default 5) and Hadith (default 25) work now share one runner and one dependency installation. The translation script uses one configured Gemini key/model request per article, stops the batch on quota/rate-limit responses, and reports partial failure instead of returning a false green status. Hadith sync failures likewise fail the workflow accurately.
- **Android asset publisher:** the job is gated before runner allocation for irrelevant source pushes; tags and explicit retry state remain supported.
- **Secret readiness:** credential checks run before dependency installation. Existing production environment secrets are used rather than duplicated into repository secrets.

## GitHub configuration findings

- Repository-level secret inventory was empty; the existing `production` environment contained the required secret names. Before this change, the affected scheduled jobs referenced `secrets.*` without binding the `production` environment, so those environment-scoped secrets were not in job scope.
- The production environment API reported no required-reviewer protection rules. Jobs that receive its secrets now also require `github.ref == 'refs/heads/main'`, including manual dispatch paths. The Vercel release job has the same branch guard.
- Branch-protection/ruleset inspection returned GitHub API `403` (the account/repository plan does not expose those endpoints). The audit therefore does not claim that PR checks are formally required for merging.
- In the last 50 visible runs on GitHub, the sample included 14 video-worker runs (10 failures), 33 dispatcher runs (26 failures), and 3 English-sync runs (2 failures). The run-log API returned empty step arrays/logs unavailable, so the precise runtime error for those historical runs could not be confirmed. The secret-scope mismatch is confirmed and addressed in this branch, but successful post-change production execution still needs to be observed on the next normal scheduled run; no production worker was manually dispatched for testing.

## Validation performed

- `pnpm verify:pr` — passed, including lint, TypeScript, route inventory, authentication, content integrity, security, video/admin/kids checks, and the updated scheduler invariants.
- `pnpm build` — passed; Next.js production build completed and emitted the existing route set.
- YAML syntax parsing — passed for all 10 remaining GitHub workflow files and `.circleci/config.yml` (11 files total).
- Prettier check — passed for the rewritten English-sync workflow and background-jobs runbook.
- `git diff --check` — passed.
- Existing non-blocking project warning: route inventory reports 125 pages and 73 API routes, while one integrity baseline expects 72 APIs. The route tests pass; this discrepancy predates and is unrelated to the workflow changes.

## Non-goals / deliberately preserved

The audit did not change the video daily output target, the automatic publishing settings, prayer scheduling, public health checks, release deployment semantics, Android tag build/release stages, or manual recovery controls. No new secrets were introduced, and no production workflow was manually executed.

## Approval and merge status

The repository owner explicitly approved the existing public-posting behavior on 2026-10-07. The video worker already sets `SOCIAL_PUBLISH_ENABLED=true` and `AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL=false`; attaching it to the existing `production` environment makes its configured YouTube/Facebook credentials available to future scheduled runs. No production worker was manually started.

PR [#244](https://github.com/zikr-org/Zikr/pull/244) remains open and unmerged. Its three PR workflows (Quality Gate, Supabase Production Health, CircleCI Config Validation) failed twice before any step ran: GitHub returned an empty runner name and empty step list for each job. Actions are enabled and `allowed_actions` is `all`; the integration cannot retrieve the failure logs or billing-usage data, so the exact runner-startup restriction is unconfirmed. This pattern may be consistent with an account/org runner or billing limit, but that cause is not proven. **Merge remains blocked until all remote PR checks complete successfully.**
