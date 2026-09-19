# ZIKR | ذِكرٌ

## A Premium Islamic Spiritual Platform

ZIKR is an Arabic-first Islamic content and spiritual platform covering Quran, Hadith, Adhkar, Dua, prayer times, Qibla, Islamic stories, Prophets, Companions, Scholars, Kids, audio, radio, articles, videos, memorization, and related tools.

## Current production architecture

- **Web:** Next.js 16 App Router + React 19 + TypeScript
- **UI:** Tailwind CSS 4 and reusable React components
- **Backend:** Next.js Route Handlers/Server Actions
- **Database:** Supabase PostgreSQL with RLS
- **Schema:** Supabase PostgreSQL schema managed exclusively through canonical SQL migrations in `supabase/migrations`
- **AI:** Google Gemini for optional AI-assisted features
- **Media:** Supabase Storage and Cloudinary where required
- **Web deployment:** Vercel
- **Mobile:** Capacitor Android/iOS
- **Automation:** Supabase `pg_cron` owns production prayer Web Push scheduling; no GitHub Actions workflow is part of the production runtime or build pipeline

## Video and social automation

Production video generation uses the free deterministic FFmpeg template renderer. Queue processing is executed by the configured external/server-side automation path and is not dependent on GitHub Actions.

```text
video_generation_requests
        ↓
server-side / Supabase queue processing
        ↓
FFmpeg template renderer
        ↓
Supabase Storage
        ↓
social_publish_queue
        ├── YouTube
        └── Facebook / Reels
```

HeyGen is not required for production video generation. Historical HeyGen database fields are retained only for migration compatibility.

## Required runtime configuration

Use `.env.example` as the configuration reference. Production secrets must remain in protected server-side stores and must never be committed.

Core variables include:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` / `YOUTUBE_REFRESH_TOKEN` for YouTube publishing
- `FACEBOOK_PAGE_ID` / `FACEBOOK_PAGE_ACCESS_TOKEN` for Facebook publishing
- `FACEBOOK_GRAPH_API_VERSION` for the canonical Meta publisher
- `GEMINI_API_KEY` for optional AI features

## Development

Prerequisites: Node.js 22.x and pnpm 9.15.0.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Useful verification commands:

```bash
pnpm lint
pnpm check
pnpm project:check
pnpm mobile:check
pnpm supabase:migrations:check
pnpm verify
```

`pnpm verify` is the repository integrity gate; Vercel builds with `pnpm build`.

## Database migrations

`supabase/migrations/` is the only canonical deployment migration chain. Do not introduce a second schema-migration mechanism.

```bash
pnpm supabase:migrations:check
pnpm supabase:migrations:replay
```

Never reset production migration history just to reconcile a preview or local branch.

## Repository structure

```text
app/                 Next.js routes, pages and API handlers
components/          Reusable UI and feature components
lib/                 Shared infrastructure, Supabase clients, types and utilities
supabase/             Supabase config, functions and canonical migrations
scripts/              Verification, imports and background workers
android/              Capacitor Android project
ios/                  Capacitor iOS project
mobile/               Mobile configuration/assets
public/               Public static assets and offline/PWA files
.github/              Repository metadata only; GitHub Actions workflows are intentionally retired
.circleci/            Secondary/recovery CI configuration
```

## Security

The project uses Supabase RLS, server-side service-role boundaries, protected OAuth credentials, HTTPS, security headers, and external verification gates. Never expose service-role keys, refresh tokens, page access tokens, or scheduler secrets to client code.

## Release process

The current release metadata baseline is `1.0.0` / versionCode `53` / `com.zikr.app` / target SDK 36. The v1.4.x documents are historical release records.

Before releasing:

```bash
pnpm verify
pnpm mobile:check
```

## Support

- Website: https://zikrmediaofficial.vercel.app
- Repository: `Zikrmediaofficial/Zikr`
- Issues: use GitHub Issues for reproducible bugs and feature requests

## License

MIT
