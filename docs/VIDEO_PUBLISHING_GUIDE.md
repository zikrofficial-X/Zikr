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

The admin video workspace provides a five-part human review checklist: source/text, audio, visuals, captions, and usage rights. A reviewer can approve a completed request; approval is tied to the current media record, and regeneration resets the prior review.

The live production setting `video_automation_auto_publish=true` selects unattended publication mode. In this mode the publisher does not require the human checklist, but it still fails closed unless the linked request exists, is `completed`, and its stored media URL exactly matches the queued media URL. Provider readiness, Facebook OAuth state, queue idempotency, bounded retries, and platform result checks remain enforced. This is the configured automatic mode requested for production.

When `video_automation_auto_publish=false`, the worker enables the human review requirement and holds unreviewed video items. Do not confuse this setting with the separate global social worker schedule.

Approval is not a scheduler. The existing GitHub Actions social worker checks the queue on its 15-minute schedule and publishes eligible items automatically; it processes one queue item per run to limit provider pressure.

## Social publishing

The social workflow is scheduled every 15 minutes through `publish-social.yml`, but public posting is currently paused.

It consumes ready rows from `social_publish_queue` and never renders video.

Publishing is explicitly controlled by environment variables:

```text
SOCIAL_PUBLISH_ENABLED=false
SOCIAL_PUBLISH_FACEBOOK_ENABLED=false
```

With the global flag false, scheduled and manual runs do not claim or publish queue items. The Admin worker button dispatches `operation=publish_queue`; it must not use GitHub's `none` default. YouTube and Facebook credentials are required only after public posting is explicitly re-enabled.

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
