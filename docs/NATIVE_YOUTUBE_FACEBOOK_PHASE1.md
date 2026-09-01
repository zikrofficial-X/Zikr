# ZIKR — Native YouTube → Facebook Phase 1

## Scope

Phase 1 changes only GitHub/project files. No Supabase schema or scheduler changes are executed in this phase.

## Existing integration points

- YouTube feed/cache: `lib/services/youtube.ts`
- YouTube channel id/API key: `YOUTUBE_CHANNEL_ID`, `YOUTUBE_API_KEY`
- Existing video media field: `videos.video_url`
- Facebook page credentials: `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN`
- Existing admin protection: `requireAdminApi`

## Native-only rule

The future publishing worker must publish only a real media file to Facebook's video publishing endpoint. A YouTube watch URL is never an acceptable media source for native publishing. Items without a real source media URL remain queued as `waiting_media` and are not converted to link posts.

## Phase 2

- Apply database migration for queue/state/idempotency.
- Configure Storage/media records where required.
- Deploy the Supabase worker and scheduler.

## Phase 3

- Validate discovery, queue claims, media matching, native Facebook upload, retries, duplicate prevention, scheduler execution, and production build/deployment.
