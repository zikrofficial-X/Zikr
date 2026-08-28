# Automation source findings — 2026-08-18

## YouTube Data API

Source: https://developers.google.com/youtube/v3/docs/videos/insert

The official `videos.insert` endpoint uploads a video and accepts metadata. The documentation states that an upload call has a quota impact of 100 units and that uploaded files must be video MIME types. It requires OAuth scopes such as `https://www.googleapis.com/auth/youtube.upload`. The documentation also warns that API projects created after 28 July 2020 may be restricted to private viewing until the project passes an audit.

## Facebook Pages API

Source: https://developers.facebook.com/documentation/pages-api/posts

The official Pages API supports publishing Page feed posts through `/{page_id}/feed`; scheduled posts must be between 10 minutes and 30 days in the future. Required permissions listed by Meta include `pages_manage_posts`, `pages_read_engagement`, and, for publishing video, `publish_video`, with the app user able to perform the relevant Page tasks.

## Facebook Reels API

Source: https://developers.facebook.com/documentation/video-api/guides/reels-publishing

Meta documents a three-step Page Reel flow: initialize an upload session, upload the video, then publish it. The documented Reel constraints include MP4, vertical 9:16, recommended 1080x1920, 3–90 seconds, and a limit of 30 API-published posts in a moving 24-hour period. Page access tokens and permissions including `pages_manage_posts` are required.

## CircleCI schedule triggers and free usage

Sources: https://circleci.com/docs/guides/orchestrate/schedule-triggers/ and https://circleci.com/pricing/

CircleCI schedule triggers can run pipelines periodically and can pass typed pipeline parameters. The scheduling system can be the actor, and schedules can be configured from the CircleCI web app or API. CircleCI’s current pricing page documents 30,000 free credits per month for personal/non-open-source usage and lists Docker/Linux support on the Free plan. The user’s project currently has successful CircleCI verification, but the CircleCI account is not logged in within the browser session, so creating the actual schedule trigger requires the user’s authenticated CircleCI session.

## Current ZIKR production queue evidence

The Supabase production inventory on 2026-08-18 found 2 video requests, both failed, 0 pending, 0 processing, 0 completed, and 0 social queue items. One failure was caused by HeyGen HTTP 402 insufficient credits; another was blocked because an administrator-reviewed narration of at least 30 characters was required. This confirms that the existing HeyGen-only path cannot provide a free autonomous pipeline.
