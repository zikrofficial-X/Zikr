# ZIKR v1.4.13

## Release highlights

- Production video generation is locked to the free deterministic FFmpeg renderer in `scripts/jobs/template-video-automation.ts`.
- The production `/api/internal/video-processing` route no longer invokes HeyGen or polls HeyGen jobs; it seeds and processes the free renderer queue directly, then processes social publishing.
- The scheduled background runner ignores non-`template` generator values and cannot route production work to HeyGen.
- The legacy `scripts/jobs/process-videos.ts` entrypoint now delegates to the same free renderer instead of requiring HeyGen credentials.
- YouTube publishing remains OAuth-based and queue-driven. Generated MP4 files are uploaded through the YouTube Data API `videos.insert` resumable upload flow when the configured YouTube OAuth credentials are present.
- Facebook publishing remains queue-driven and uses the configured Page access token independently from video generation.
- HeyGen environment variables were removed from the example production workflow and `.env.example`; any old HeyGen secrets that still exist in GitHub/Vercel are unused by the production execution path and may be deleted manually.
- Android release metadata is aligned to versionName `1.4.13`, versionCode `44`, applicationId `com.zikr.app`, target SDK `36`.

## Verification scope

- GitHub `main` source was reviewed for active HeyGen references in the production video entrypoints.
- Supabase currently contains 11 completed video-generation requests with rendered `video_url` values, confirming the free renderer has already produced persisted video artifacts; current aggregate state also contains 4 failed historical requests. No current row-level claim is made about their provider without a row-by-row audit.
- Current Supabase cron configuration calls the canonical production Vercel video-processing endpoint for the video queue, while Supabase-native jobs continue to call Supabase Edge Functions as expected.
- Vercel production build verification for the latest deployment reports no build errors, and the deployment reached `READY` after the new repository changes propagated.

## YouTube operational note

YouTube uploads require OAuth 2.0 authorization with an upload-capable scope such as `https://www.googleapis.com/auth/youtube.upload`; an API key alone cannot upload a video. Unverified API projects can upload only as private until the project completes Google's audit requirements.

## Important note about "free AI"

The production renderer in this release is intentionally free and deterministic rather than a hosted generative-video model. This avoids dependence on paid provider credits or unreliable public GPU queues. Gemini remains available separately for AI-assisted content/narration workflows, but the actual MP4 render does not require HeyGen, a paid video API, or a dedicated GPU provider.
