# Environment Variables

This document outlines the environment variables used in the ZIKR project, their purpose, and whether they are public or server-side.

## Required Environment Variables

The following environment variables are required for the application to function correctly.

| Variable Name             | Description                                                                 | Type     |
| :------------------------ | :-------------------------------------------------------------------------- | :------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | The public URL for your Supabase project.                                   | Public   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public anonymous key for your Supabase project.                         | Public   |
| `NEXT_PUBLIC_SITE_URL`          | The locked canonical public URL: https://zikrmediaofficial.vercel.app.                                        | Public   |
| `SUPABASE_SERVICE_ROLE_KEY`     | The Supabase service role key, used for server-side operations.             | Server   |
| `AUTH_CALLBACK_URL`             | OAuth callback URL. Use the Supabase provider callback (`https://eydxvcamhjhajxjrsgym.supabase.co/auth/v1/callback`) for provider registration, or the app callback (`${NEXT_PUBLIC_SITE_URL}/auth/callback`) for app redirects. | Server   |

## Optional Integration Environment Variables

The following environment variables are optional and are used for integrating with external services. Hadith reads Supabase first and uses the configured Ummah-compatible provider only when the database is unavailable. File uploads use the Supabase Storage buckets configured in `supabase/config.toml`; no AWS S3 variables are required.

| Variable Name             | Description                                                                 | Type     |
| :------------------------ | :-------------------------------------------------------------------------- | :------- |
| `GEMINI_API_KEY`                | API key for Google Gemini services.                                         | Server   |
| `GEMINI_MODEL`                  | Optional Gemini model override (recommended: `gemini-2.5-flash`).           | Server   |
| `HADITH_API_BASE_URL`          | Base URL for the Hadith API; defaults to `https://ummahapi.com/api/hadith` and can be overridden with a provider exposing the configured contract. | Server   |
| `YOUTUBE_API_KEY`               | API key for YouTube services.                                               | Server   |
| `YOUTUBE_CHANNEL_ID`            | YouTube channel ID.                                                         | Server   |
| `YOUTUBE_CLIENT_ID`              | OAuth client ID used for YouTube uploads.                                   | Server   |
| `YOUTUBE_CLIENT_SECRET`          | OAuth client secret used for YouTube uploads. Keep secret.                  | Server   |
| `YOUTUBE_REFRESH_TOKEN`          | Long-lived OAuth refresh token granted with the `youtube.upload` scope.     | Server   |
| `FACEBOOK_PAGE_ID`               | Facebook Page ID that receives uploaded videos and Reels.                   | Server   |
| `FACEBOOK_PAGE_ACCESS_TOKEN`     | Page access token with the Meta Page publishing permissions.                | Server   |
| `VIDEO_AUTO_PUBLISH`             | Set to `false` to keep completed videos queued without publishing; defaults to automatic publishing when credentials exist. | Server |

## Automatic Video Upload and Social Publishing

The admin dashboard supports selecting a local MP4/WebM/MOV file. The browser uploads it directly to the Supabase `videos` Storage bucket using an admin-only signed upload URL, then the server action stores the public source URL in the `videos` metadata and creates a durable `social_publish_queue` item. The Supabase scheduled worker processes that queue without requiring the browser to remain open.

YouTube uploads use OAuth2 and require `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, and `YOUTUBE_REFRESH_TOKEN`; the refresh token must be granted with the official `https://www.googleapis.com/auth/youtube.upload` scope. Facebook publishing uses `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN`; the token must belong to a Page and the Meta app must have the Page publishing permissions required by Meta. Never place these values in client-side code or commit them to Git.

## Deployment Validation

Run the deployment environment check before shipping a release:

```bash
pnpm deploy:check
```

The command validates required runtime variables, URL shape, Supabase REST reachability, optional YouTube reachability, and common retired-variable mistakes without printing secret values.

> Security note: never commit real Supabase service-role keys, database URLs, Gemini keys, YouTube keys, or Google OAuth secrets. If any secret is shared in chat or logs, rotate it in the provider dashboard before deploying.

## Runtime Validation

Environment variables are validated at runtime using `zod` to ensure their presence and correct format. Missing or invalid required variables will cause the application to throw an error during startup, preventing potential issues.

## .env.example

The `.env.example` file in the project root provides a template for all environment variables. It should be copied to `.env` and populated with actual values for local development and deployment.
