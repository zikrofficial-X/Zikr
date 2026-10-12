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
- **Automation:** Supabase `pg_cron` owns prayer/source-agent scheduling; GitHub Actions owns quality gates, video generation, social publishing, and controlled releases; CircleCI owns the application build/documentation, Android, Supabase-gate, and English-sync lanes

## Video and social automation

Production video generation uses the deterministic FFmpeg template renderer. GitHub Actions is the sole production video worker. Social publishing is a separate GitHub Actions worker consuming `social_publish_queue`; CircleCI does not execute either production worker.

## Required runtime configuration

Use `.env.example` as the configuration reference. Production secrets must remain in protected server-side stores and must never be committed.

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

`supabase/migrations/` is the only canonical deployment migration chain.

```bash
pnpm supabase:migrations:check
pnpm supabase:migrations:replay
```

Never reset production migration history just to reconcile a preview or local branch.

## Repository structure

```text
src/app/              Next.js routes, pages and API handlers
src/components/       Reusable UI and feature components
src/lib/              Shared infrastructure, Supabase clients, types and utilities
src/features/         Canonical domain feature modules
supabase/             Supabase config, functions and canonical migrations
scripts/              Verification, imports and recovery tooling
android/              Capacitor Android project
ios/                  Capacitor iOS project
mobile/               Mobile configuration/assets
public/               Public static assets and offline/PWA files
.github/              GitHub Actions quality gates, releases and automated video workflows
.circleci/            Secondary/recovery CI configuration
```

## Information architecture

The canonical public section map lives in `src/lib/navigation/catalog.ts`. The `/sections` route is the single navigation index for public sections; `/audio` is the unified visitor audio library. New public sections must be added to the catalog and pass `pnpm information-architecture:check`.

## Security

The project uses Supabase RLS, server-side service-role boundaries, protected OAuth credentials, HTTPS, security headers, and external verification gates. Never expose service-role keys, refresh tokens, page access tokens, or scheduler secrets to client code.

## Release process

Current application version: `1.1.3`; canonical Android tag: `v1.1.3`; application ID: `com.zikr.app`; target SDK: `36`.

Before releasing:

```bash
pnpm verify:pr
pnpm mobile:check
```

Production web deployment is controlled through `.github/workflows/release-finalization.yml`. Android release uses one semantic tag (`vX.Y.Z`) with CircleCI for the signed build and GitHub Actions for release-asset verification/publication.

## Support

- Website: https://zikrmediaofficial.vercel.app
- Repository: `zikrofficial-X/Zikr`
- Issues: use GitHub Issues for reproducible bugs and feature requests

## License

MIT
