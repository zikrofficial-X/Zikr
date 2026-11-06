# ZIKR Social Publishing Operations

## Channel separation

Facebook, Facebook Reels, and YouTube share the durable delivery queue but execute as independent targets. The original `target_platforms` field is immutable during a retry; each target's result and retry count live in `metadata.platformResults` and `metadata.platformAttempts`.

GitHub Actions checks readiness independently. Facebook requires an enabled OAuth-managed Page credential in Supabase; YouTube requires the three YouTube OAuth secrets. The worker claims a row only when at least one selected target is enabled and still needs delivery. A missing or expired connection for one provider does not disable the other provider.

## Operator enable switches

Optional GitHub Actions repository variables:

- `FACEBOOK_PUBLISHING_ENABLED`: `true` to allow Facebook Page/Reels delivery, `false` to hold Facebook targets while YouTube continues.
- `YOUTUBE_PUBLISHING_ENABLED`: `true` to allow YouTube delivery, `false` to hold YouTube targets while Facebook continues.

Both default to `true` when absent. They do not replace OAuth readiness. A provider target is enabled only when its operator switch and its own credential checks both pass. `SOCIAL_PUBLISH_ENABLED=false` remains the global emergency stop.

## Human video approval

Every public video target requires a persisted, five-part human QA approval bound to the current source, content, template version, and media URL. The worker checks it before claim and immediately before each provider call. A missing, stale, or changed approval holds the video; written-only posts keep their separate reviewed-source path.

## Independent retry behavior

Successful provider post IDs are retained and never republished. An unavailable provider is marked in `unavailablePlatforms` and retried on a later scheduled run without consuming attempts. Facebook auth failures are scoped to Facebook targets. Per-channel attempt ceilings are stored under `platformAttempts`. After Facebook reauthorization, only Facebook failures/attempt counters are cleared; YouTube delivery history is retained.

## Monitoring

- Admin → Social Publishing shows independent connection health cards, a read-only YouTube channel test, Facebook Page test/reconnect, per-channel status totals, and queue filters for YouTube, Facebook, and Facebook Reels.
- YouTube channel profile reads prefer OAuth. When the OAuth token lacks channel-read scope, the health check falls back to the server-only `YOUTUBE_API_KEY` + exact `YOUTUBE_CHANNEL_ID` and reports `public_data_only`; it only displays fields that YouTube exposes publicly. This does not grant private Analytics reports. For owner metrics, reauthorize with `youtube.readonly` and `yt-analytics.readonly`, then rotate the refresh token in Vercel and GitHub Actions.
- The scheduled GitHub Actions worker runs every 15 minutes and syncs YouTube public post metrics and Facebook Reels Insights independently.
- Admin analytics reports GA4 site traffic separately from owner-authorized YouTube Analytics and Facebook Reels post insights. Missing provider data is shown as unavailable, not zero.
- A read-only connection test never uploads, edits, or publishes a post.

## Safe recovery

Use the channel-specific connection test and reconnect that provider. The retry action preserves the original target set and skips targets that already have a successful remote ID. Do not bulk-approve videos or retry a large backlog until the provider connection and queue preview have been reviewed.