# Facebook publishing: one-time reconnect and automatic recovery

## Why the old connection stopped

The previous Page Access Token is rejected by Meta with an expired-session / invalid-access-token response. A feature flag cannot renew an expired Meta token. The administrator must authorize the Meta app once again; after this connection succeeds, publishing resumes automatically.

## What the application now does

- `/admin/social` tests the live Page token, distinguishes a revoked/expired token from a disabled setting, and offers **ربط/تجديد Facebook**.
- The server-side OAuth callback exchanges the login code for a long-lived user token, obtains the Page-scoped token for the configured `FACEBOOK_PAGE_ID`, verifies the Page, and requires `pages_show_list`, `pages_read_engagement`, and `pages_manage_posts`.
- The renewed Page token is written to `social_platform_credentials`, a server-only table with RLS enabled and no access granted to anonymous/authenticated browser roles. It is never returned to the browser or printed in logs.
- This database record becomes the canonical token for the public Facebook Page card, generated video queueing, and the Facebook/Facebook Reels publisher. The previous environment token remains only as a migration/backward-compatibility fallback.
- After a successful reconnect, Facebook auth-blocked queue entries are safely re-queued, previously published platforms remain marked as successful, and the dedicated GitHub publisher workflow is dispatched. The normal publisher schedule continues every 15 minutes even if an immediate dispatch cannot be started.

## One-time Meta configuration

1. In Meta for Developers, ensure the app has Facebook Login enabled and can request the page-management permissions above.
2. Add this exact redirect URI to the app's Valid OAuth Redirect URIs, using the configured `NEXT_PUBLIC_SITE_URL` origin:

   `https://zikrmediaofficial.vercel.app/api/admin/social/facebook/callback`

   If the canonical site URL changes, update the Meta allowlist to match the configured URL exactly.
3. Confirm `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_PAGE_ID`, `FACEBOOK_GRAPH_API_VERSION`, `SUPABASE_URL`, and the server-only Supabase service-role credential are available to the production runtime.
4. Open **Admin → مركز النشر → ربط/تجديد Facebook**, sign in to Meta, select the account that manages the configured Page, and approve the requested permissions.
5. Return to the Admin page. It should show **متصل — النشر التلقائي مفعّل**. Press **اختبار الاتصال** to verify the token again; no manual worker run is required for normal operation.

## Automatic operation

- GitHub Actions runs the social publisher every 15 minutes and queues generated media to Facebook/Facebook Reels when a connected Page is enabled.
- The **تشغيل العامل الآن** button is only an immediate/manual trigger; it is not a recurring-scheduler dependency.
- Reconnection releases Facebook auth-blocked queue items. Their already-published YouTube/Facebook targets are preserved and are not republished successfully a second time.
- YouTube publishing continues to use its own OAuth refresh token and is not coupled to Facebook reconnection.

## Troubleshooting

- `redirect_uri_mismatch`: make the Meta allowlisted redirect URI match the configured canonical site URL character-for-character.
- `permission_missing`: reconnect and approve all three required page permissions, and ensure the authorizing Facebook identity manages the configured Page.
- `page_not_found`: the authorized identity does not manage the `FACEBOOK_PAGE_ID` configured for ZIKR.
- A revoked user session cannot be silently refreshed from the old Page token alone. Run the one-time OAuth reconnect; after the new Page token passes the live check, the recurring publisher is automatic.
