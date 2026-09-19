# Zikr Project Deployment Guide

**Latest Update**: Supabase + Vercel sync is configured and ready. Follow steps below to complete the setup.

To ensure the project works correctly on production (Vercel) and with Supabase, follow these steps:

## 1. Supabase Configuration

### Authentication
1. Go to **Authentication > Providers > Google**.
2. Enable Google Provider.
3. Add your **Client ID** and **Client Secret** from Google Cloud Console.
4. In **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://zikrmediaofficial.vercel.app/auth/callback` (production)
   - Do **not** use `/api/auth/callback`; this app handles auth at `/auth/callback`.

### Database
Supabase SQL migrations are the single official database migration path for this project. All deployable SQL lives in `supabase/migrations`. The application does not use Drizzle or a direct PostgreSQL URL at runtime.

Run exactly one database command before deploying:

```bash
pnpm db:migrate-supabase
```

Do not use any parallel ORM schema-push command for deployment; the canonical Supabase migration chain must remain authoritative.

## 2. Vercel Environment Variables

Add the following variables to your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (Keep Secret) |
| `NEXT_PUBLIC_SITE_URL` | Locked production URL: `https://zikrmediaofficial.vercel.app` |
| `AUTH_CALLBACK_URL` | Locked application callback: `https://zikrmediaofficial.vercel.app/auth/callback` |
| `GEMINI_API_KEY` | Optional: For AI features |
| `YOUTUBE_API_KEY` | Optional: For fetching YouTube data |
| `YOUTUBE_CHANNEL_ID` | Optional: YouTube channel ID for the video feed |
| `GEMINI_MODEL` | Optional: Gemini model name, e.g. `gemini-2.5-flash` |

## 3. Pre-deployment Validation

Before deploying, run:

```bash
pnpm deploy:check
pnpm check
pnpm build
```

`pnpm deploy:check` intentionally prints only variable names and pass/fail results; it does not print secret values. Fix any ❌ failures before deploying. ⚠️ warnings identify optional integrations or migration-only values that may still be needed for the full production setup.


## 4. Features Status

- **Quran**: Fully functional via AlQuran API.
- **Tafsir**: Integrated into Ayah detail pages.
- **Hadith**: Connected to live API with pagination.
- **Stories**: Integrated with YouTube embed support.
- **Auth**: Google OAuth and Email/Password ready.

## 5. GitHub Sync
Push the latest changes to your repository:
```bash
git add .
git commit -m "Fix: APIs, Environment variables, and Content integrations"
git push origin main
```
