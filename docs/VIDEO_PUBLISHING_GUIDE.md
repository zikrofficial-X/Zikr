# ZIKR — Video Generation & Social Publishing Runbook

## Current ownership

| Responsibility | Owner | Workflow |
|---|---|---|
| Video generation | GitHub Actions | `.github/workflows/generate-ai-video.yml` |
| Social publishing | GitHub Actions | `.github/workflows/publish-social.yml` |
| Application build/documentation | CircleCI | `application-build-docs` |
| Android build/signing | CircleCI | `android-rebuild` |
| Prayer notifications | Supabase | `prayer-notification-worker` + pg_cron |
| Source-verified content ingestion | Supabase | `source-verified-content-agent` + pg_cron |

There is no CircleCI production video/social worker and no Vercel Cron for video or social publishing.

## Video pipeline

Production video generation runs four times daily:

- 03:17 UTC
- 09:17 UTC
- 15:17 UTC
- 21:17 UTC

The same workflow also exposes a deliberate manual dispatch for recovery or an admin Run Now request.

The worker executes:

`pnpm background:jobs`

The canonical rendering path is the deterministic FFmpeg template renderer. Source religious text is treated as authoritative; AI may be used only for optional supporting layers such as reflections/captions.

Queue safety is enforced through:

- idempotent automation keys;
- conditional queue claims;
- stale-processing recovery;
- bounded retry attempts;
- separate generation and publication responsibilities.

Video generation may enqueue a row in `social_publish_queue`, but it must not publish directly.

## Video publication integrity and review modes

The admin video workspace provides a five-part human review checklist: source/text, audio, visuals, captions, and usage rights. A reviewer approves a completed request; the approval is persisted with reviewer ID, timestamp, checklist, and a snapshot hash covering source, content, template version, and media URL. Regeneration or any snapshot change invalidates the prior approval.

Unattended publishing means the worker can publish approved items on its schedule; it does not mean approval can be bypassed. Every video queue item is checked before it is claimed and checked again immediately before platform calls. Missing, rejected, incomplete, stale, or changed approvals fail closed. Workflow environment flags cannot disable this rule.

Written-only posts follow their separate source-validation and editorial approval contract. The publisher continues to reuse the same queue and per-platform idempotency ledger.

Approval is not a scheduler. The existing GitHub Actions social worker checks the queue on its 15-minute schedule and publishes only eligible, approved items.
## Social publishing

The social workflow is scheduled every 15 minutes through `publish-social.yml`. The current workflow configuration sets `SOCIAL_PUBLISH_ENABLED=true`; each run still performs protected runtime preflight and only publishes when the required Supabase, YouTube OAuth, Facebook Page connection, and queue checks pass.

It consumes ready rows from `social_publish_queue` and never renders video. YouTube and Facebook readiness are evaluated separately, so a platform that fails preflight is not assumed to be available merely because the workflow is scheduled.

The explicit workflow setting is:

```text
SOCIAL_PUBLISH_ENABLED=true
```

The workflow derives `SOCIAL_PUBLISH_FACEBOOK_ENABLED` from the verified OAuth-managed Facebook Page credential; do not hardcode or bypass this preflight. The Admin worker button dispatches `operation=publish_queue`; it must not use GitHub's `none` default.

A provider failure is recorded as a failure for that provider; it must not make video generation appear failed when the generated media itself is valid.

## Monetag SmartLink

Eligible non-kids social videos append the disclosed Monetag SmartLink to YouTube descriptions and Facebook/Reels captions at publish time. YouTube's tags field receives descriptive keywords; the actual URL remains in the description because tags are not clickable links.

The link is excluded from child-directed videos and is omitted from Facebook video captions when the source audience cannot be verified. The website placement is limited to the homepage, public video hub, and eligible general-public footer routes; it is not shown in children's or sacred-text/worship-tool interfaces.

This integration does not turn on social publishing. The established `SOCIAL_PUBLISH_ENABLED` and provider readiness gates remain authoritative. Already-published posts are not edited or republished.

See `docs/MONETAG_SMARTLINK_PLACEMENT.md` for placement and verification details.

## Admin Run Now

Admin Run Now does not run a separate poller or second scheduler.

The admin action dispatches the canonical GitHub video workflow directly. The workflow concurrency group prevents overlapping production generations.

## Recovery

Use GitHub Actions workflow dispatch for deliberate video or social recovery.

Do not add:

- Vercel Cron;
- Supabase pg_cron for video/social;
- CircleCI `scripts/run-background-jobs.ts`;
- a second social publisher.

## Relevant verification

```bash
pnpm scheduler:check
pnpm video:contract:check
pnpm voice:factory:check
pnpm video:factory:check
pnpm video:qa:check
pnpm social:publish:check
pnpm video:engine:check
```

For the complete ownership matrix, see `docs/AUTOMATION_OWNERSHIP_2026-10-08.md`.
For queue internals, see `docs/background-jobs.md`.


## Written Facebook posts

The written-post factory runs through .github/workflows/generate-written-content.yml, independently from video production. It selects published/reviewed content records, preserves Quran/Hadith/Dua/Adhkar quotations verbatim, and queues the post as content_type=written_post with video_url=null and Facebook as the target. It reuses the existing social_publish_queue and publish-social.yml publisher; there is no second publishing worker. The workflow requires GEMINI_API_KEY as a GitHub Actions secret in the production environment. Vercel environment variables are not automatically available to GitHub Actions.

## Generated media lifecycle

Generated video binaries are temporary publishing assets. The publisher removes eligible source media only after every requested platform has a confirmed remote ID. On partial publication it retains the source for unfinished targets and retries only targets without a confirmed remote ID. Queue records, remote IDs, source references, and audit metadata remain available after media cleanup.

## Optional additional Hugging Face Spaces

The video worker accepts up to five additional public Spaces through the GitHub Actions variable HF_VIDEO_CUSTOM_SPACES, using a JSON array such as:
[{"space":"owner/space-one","variant":"wan2_2_fast","enabled":true},{"space":"owner/space-two","variant":"ltx_fast","enabled":true}]

Each Space must expose a Gradio API compatible with the existing Wan 2.2 or LTX Fast adapter. Any other input/output signature needs a dedicated adapter before use. Free quotas, queue availability, runtime availability, and commercial terms are controlled by the Space owner and Hugging Face; VIDEO_FREE_ONLY=true does not guarantee unlimited free GPU time.
