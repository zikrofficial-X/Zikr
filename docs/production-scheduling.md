# ZIKR Production Scheduling

ZIKR has one authoritative automatic scheduler per production workload. Prayer Web Push runs inside Supabase: `pg_cron` invokes the `prayer-notification-worker` Edge Function once each minute over a private bearer channel. The video and social queues run through the separate `zikr-video-processing` cron job, which calls the authenticated Vercel route `/api/internal/video-processing`. The prayer job plans a two-day window from each user’s saved location and preference record, persists unique delivery rows per device, then claims and sends only due rows.

| Workload                              | Authoritative execution owner                     |                  Cadence | Safety boundary                                                                                                                          |
| ------------------------------------- | ------------------------------------------------- | -----------------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Prayer Web Push planning and delivery | Supabase `pg_cron` + `prayer-notification-worker` |             Every minute | Private scheduler token, per-device delivery uniqueness, atomic row claims, bounded retries, invalid-subscription deactivation.          |
| Client-local azan and reminder sounds | Browser only                                      | While the page is active | Remains an offline/local fallback; it does not create server deliveries.                                                                 |
| Social publishing queue               | Supabase `pg_cron` → `/api/internal/video-processing` | Every minute | Conditional queue claims and provider-side credentials remain server-only; GitHub is recovery only. |
| Video generation and publishing queue | Supabase `pg_cron` → `/api/internal/video-processing` | Every minute | Persisted HeyGen IDs are polled before new submissions; GitHub is recovery only. |
| Repository verification               | Vercel deployment build gate                      |     Every Git deployment | `pnpm verify` runs before Vercel publishes the build.                                                                                    |

## Prayer Web Push lifecycle

A signed-in user first selects a location on `/prayer-times`, then explicitly enables background prayer alerts in `/settings`. The browser registers its Push API subscription only after notification permission is granted. The authenticated API persists the device subscription, default location, and enabled-prayer preferences while enforcing ownership on the server.

The minute worker initializes a private VAPID key pair once in `push_runtime_settings`. Only the derived public key is returned to browsers. The private material is available solely through a service-role-only RPC and is never committed to the repository, sent to the client, or placed in a Vercel public environment variable.

Each delivery has a unique `(push_subscription_id, prayer_name, scheduled_at)` key. A worker must claim a pending row before it sends, which prevents overlapping scheduler invocations from sending the same planned notification twice. Stale claims are recovered after ten minutes. Invalid push endpoints are deactivated after an HTTP `404` or `410`; transient failures retry with bounded exponential backoff.

> Web Push is an external side effect. The database uniqueness and claim protocol prevents duplicate dispatch from scheduler overlap. As with any external push provider, a process crash after a provider accepts a request but before the database status update may cause an at-least-once retry; the browser-side `Topic`/`tag` coalesces pending notifications for the same prayer and day.

## Configuration and operations

The Edge Function is deployed with JWT verification disabled because it accepts only the private database-scheduler bearer token. The function independently verifies that token against the service-role-only `get_push_scheduler_secret()` RPC. Do not expose the scheduler token, VAPID private key, Supabase service-role key, or external social/video credentials to the browser.

The old GitHub Actions workflows are manual-only by design while GitHub reports an account-level billing lock. They remain recovery runbooks for the social and video queues and must **not** be re-enabled on a schedule while `zikr-video-processing` is active. Before changing the owner, provision provider credentials in the new server-side secret store and verify runtime limits, retry strategy, and idempotent claim behavior.

## Supabase Preview integration

Supabase GitHub Preview remains a separate external integration. Its migration history cannot safely be reconciled from this repository because production contains a materially different historical ledger. The correct operational action is to disable the GitHub Preview/automatic-branching integration in the Supabase dashboard after authenticating, while retaining production migrations and Vercel deployment verification. Do not reset production history or mark unseen migration versions as applied.
