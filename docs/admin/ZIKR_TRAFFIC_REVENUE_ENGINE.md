# ZIKR Traffic & Revenue Engine

## Scope

The Traffic & Revenue Engine is embedded in the existing Admin Analytics page at `/admin/analytics`. It is not a second social publisher, video worker, queue, or scheduler.

Its purpose is to grow legitimate audience traffic, use existing publishing systems, and provide a truthful view of monetization data.

## Existing systems reused

- `social_publish_queue` remains the canonical social publishing queue.
- `video_generation_requests` remains the canonical video production history.
- `social_platform_profiles` supplies public profile/sync metadata only.
- `/admin/social` remains the canonical social publishing console.
- `/admin/seo` remains the canonical SEO settings console.
- `/admin/automation` remains the canonical automation console.
- GitHub Actions remains the owner of the existing scheduled video/social workers. Do not add a second scheduler for those jobs.

## Data truth and privacy

The dashboard uses exact server-side counts for queue and published-content records. It does not use `admin_page_views` as public traffic because that table records views of the Admin interface.

Public visitor counts require GA4 reporting access. Impression and earnings metrics require a supported Monetag reporting integration or an administrator-reviewed Monetag CSV import. Until that source is connected, visitor, impression, and earnings figures are intentionally shown as unavailable.

The dashboard never reads or returns `social_platform_credentials.page_access_token`. Platform profile presence is not proof that an OAuth token is valid; actual publishing preflight remains the responsibility of the existing publisher.

No automated page refreshes, ad reloads, ad clicks, synthetic sessions, incentivized impressions, or other invalid-traffic mechanisms are allowed.

## Current platform coverage

The existing publisher supports its already-configured YouTube and Facebook workflows. The dashboard lists Instagram, TikTok, Telegram, WhatsApp, Pinterest, and X as unconnected expansion channels until their official APIs, OAuth permissions, and publication workflows are independently configured and tested.

## Remaining external integration requirements

### Google Analytics 4

To show public sessions, users, landing pages, and source/medium reports, configure a server-side GA4 Data API connection with a GA4 property ID and a read-only service identity that has access to that property. Credentials must be stored only in the protected Vercel environment and never in `NEXT_PUBLIC_*` variables or the repository.

### Monetag

The publisher dashboard currently has the Monetag verification meta tag and disclosed SmartLink placement in source code. This does not grant access to earnings reports. Add a reporting integration only when Monetag provides a supported publisher API credential/contract for this account. Otherwise, implement a manual CSV import with administrator review and source timestamp. Never infer revenue from visitor counts or SmartLink clicks.

## Operational checks

- Keep admin access protected by the existing `analytics.read` permission.
- Keep all Supabase reads server-side.
- Keep service-role secrets out of client code.
- Preserve the current social publishing queue and its idempotency/retry protections.
- Treat missing or failed data sources as unavailable, not zero.
- Do not publish to new platforms until the account owner authorizes OAuth scopes and the platform-specific workflow passes review.
