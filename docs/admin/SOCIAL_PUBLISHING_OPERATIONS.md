# ZIKR Social Publishing Operations

## Channel separation

Facebook, Facebook Reels, and YouTube share the durable delivery queue but execute as independent targets. The original `target_platforms` field is immutable during a retry; each target's result and retry count live in `metadata.platformResults` and `metadata.platformAttempts`.

GitHub Actions checks readiness independently. Facebook requires an enabled OAuth-managed Page credential in Supabase; YouTube requires the three YouTube OAuth secrets. The worker claims a row only when at least one selected target is enabled and still needs delivery. A missing or expired connection for one provider does not disable the other provider.

For Facebook Reels, the START-phase `video_id` is the analytics object and the FINISH-phase `post_id` is the Page post ID used for links and deletion. New queue results preserve both as `videoId` and `remoteId` respectively; only `videoId` is sent to `/{video-id}/video_insights`. Historical rows containing only the old post ID are resolved through the supported Page posts collection by matching the Page post ID and reading its video attachment/object ID.

## Operator enable switches

Optional GitHub Actions repository variables:

- `FACEBOOK_PUBLISHING_ENABLED`: `true` to allow Facebook Page/Reels delivery, `false` to hold Facebook targets while YouTube continues.
- `YOUTUBE_PUBLISHING_ENABLED`: `true` to allow YouTube delivery, `false` to hold YouTube targets while Facebook continues.

Both default to `true` when absent. They do not replace OAuth readiness. A provider target is enabled only when its operator switch and its own credential checks both pass.

The global external-publishing emergency stop is the Admin → Automation setting `video_automation_auto_publish`. Turn it off to stop all external video delivery while leaving internal generation and website publishing enabled. The social worker reads this database setting before claiming queue rows.

## Automated video QA

Every public video target requires a persisted, five-part automated QA result (source, audio, visuals, captions, rights) bound to the current source, content, template version, and media URL. The worker checks it before claim and immediately before each provider call. A missing, failed, stale, or changed QA result holds the video; no human review is required. Written-only posts keep their separate reviewed-source path.

## Independent retry behavior

Successful provider post IDs are retained and never republished. An unavailable provider is marked in `unavailablePlatforms` and retried on a later scheduled run without consuming attempts. Facebook auth failures are scoped to Facebook targets. Per-channel attempt ceilings are stored under `platformAttempts`. After Facebook reauthorization, only Facebook failures/attempt counters are cleared; YouTube delivery history is retained.

## Monitoring

- Admin → Social Publishing shows independent connection health cards, a read-only YouTube channel test, Facebook Page test/reconnect, per-channel status totals, and queue filters for YouTube, Facebook, and Facebook Reels.
- YouTube channel profile reads prefer OAuth. When the OAuth token lacks channel-read scope, the health check falls back to the server-only `YOUTUBE_API_KEY` + exact `YOUTUBE_CHANNEL_ID` and reports `public_data_only`; it only displays fields that YouTube exposes publicly. This does not grant private Analytics reports. For owner metrics, reauthorize with `youtube.readonly` and `yt-analytics.readonly`, then rotate the refresh token in Vercel and GitHub Actions.
- The social publisher retries eligible/deferred targets every 15 minutes and after successful generation. It does not sync insights during publishing runs.
- A separate GitHub Actions workflow, `sync-social-insights.yml`, refreshes YouTube public post metrics and Facebook Reels Insights daily; its target is analytics-only and external publishing is disabled.
- Admin analytics reports GA4 site traffic separately from owner-authorized YouTube Analytics and Facebook Reels post insights. Missing provider data is shown as unavailable, not zero.
- A read-only connection test never uploads, edits, or publishes a post.

## Safe recovery

Use the channel-specific connection test and reconnect that provider. The retry action preserves the original target set and skips targets that already have a successful remote ID. Do not override failed QA or retry a large backlog until the provider connection and queue preview have been checked.
## Queue readiness, immediate publishing, and remote deletion

- Admin → Social Publishing separates the active queue from the published-video ledger. The queue shows the exact persisted QA approval state for every generated video, including the automated checklist results, missing checks, fingerprint version, and any reason publication was held.
- A video is eligible only when the automated source, audio, visuals, captions, and rights checks all pass for the exact MP4. Immediate publishing only advances already eligible queue rows; it never bypasses the automated QA gate.
- The “Publish selected now” action moves selected eligible items to the front of the next GitHub Actions run. Facebook Reels provider cooldowns and platform authentication limits still apply; the action does not override provider restrictions.
- The Published Videos view uses only successful per-platform remote IDs saved in `metadata.platformResults`. “Delete from platform” calls the provider API and records each outcome in `metadata.platformDeletions`. It does not remove the ZIKR queue/audit row or the original media object.
- Deletion is independent per platform: a successful YouTube removal stays recorded even if Facebook deletion fails. Rows without a verified remote ID are marked unavailable for safe deletion rather than guessing from titles or timestamps.
- YouTube permanent deletion requires an OAuth grant that includes `youtube.force-ssl`, `youtube`, or `youtubepartner`. If the current upload token lacks that scope, the operator must reauthorize and update the YouTube refresh token in both Vercel and GitHub Actions. An API key cannot delete a video.
- Facebook removal requires the connected Page credential to authorize deletion (normally `pages_manage_posts`). Provider permission/ownership responses are shown per post and are not silently marked as deleted.
- Remote deletion is irreversible on the provider. The UI asks for confirmation on every individual or bulk deletion; queue records and delivery IDs remain for audit.
