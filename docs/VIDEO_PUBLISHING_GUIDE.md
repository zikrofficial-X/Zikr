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

## Social publishing

Social publishing runs every 15 minutes through `publish-social.yml`.

It consumes ready rows from `social_publish_queue` and never renders video.

Publishing is explicitly controlled by environment variables:

```text
SOCIAL_PUBLISH_ENABLED=true
SOCIAL_PUBLISH_FACEBOOK_ENABLED=false
```

YouTube requires the protected server-side YouTube credentials. Facebook additionally requires valid Meta Page credentials and the explicit Facebook enable flag.

A provider failure is recorded as a failure for that provider; it must not make video generation appear failed when the generated media itself is valid.

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
