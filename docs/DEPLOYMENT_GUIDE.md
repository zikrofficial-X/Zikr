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
   - `https://your-project-name.vercel.app/auth/callback` (replace with your Vercel URL)
   - Do **not** use `/api/auth/callback`; this app handles auth at `/auth/callback`.

### Database
Supabase SQL migrations are the single official database migration path for this project. All deployable SQL lives in `supabase/migrations`; the Drizzle schema is kept for application-side schema definitions and optional migration generation only.

Run exactly one database command before deploying:

```bash
pnpm db:migrate:supabase
```

Do not use Drizzle `db:push` for deployment; it is intentionally not defined because it would not apply the full Supabase migration history, including RLS policies.

## 2. Vercel Environment Variables

Add the following variables to your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (Keep Secret) |
| `DATABASE_URL` | Connection string for Drizzle (Postgres) |
| `NEXT_PUBLIC_SITE_URL` | Your production URL (e.g., `https://zikr.app`) |
| `AUTH_CALLBACK_URL` | `${NEXT_PUBLIC_SITE_URL}/auth/callback` (do not use `/api/auth/callback`) |
| `GEMINI_API_KEY` | Optional: For AI features |
| `YOUTUBE_API_KEY` | Optional: For fetching YouTube data |
| `YOUTUBE_CHANNEL_ID` | Optional: YouTube channel ID for the video feed |
| `GEMINI_MODEL` | Optional: Gemini model name, e.g. `gemini-2.5-flash` |
| `GOOGLE_CLIENT_ID` | Optional: Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional: Google OAuth client secret |

## 3. Pre-deployment Validation

Before deploying, run:

```bash
pnpm deploy:check
pnpm check
pnpm build
```

`pnpm deploy:check` intentionally prints only variable names and pass/fail results; it does not print secret values. Fix any ❌ failures before deploying. ⚠️ warnings identify optional integrations or migration-only values that may still be needed for the full production setup.

For `DATABASE_URL`, make sure the value has no spaces or line breaks. If the database password contains special characters such as `@`, URL-encode them, for example `@` becomes `%40`.

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
