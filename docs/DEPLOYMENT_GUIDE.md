# Zikr Project Deployment Guide

**Latest Update**: Supabase + Vercel sync is configured and ready. Follow steps below to complete the setup.

To ensure the project works correctly on production (Vercel) and with Supabase, follow these steps:

## 1. Supabase Configuration

### Authentication
1. Go to **Authentication → Providers → Google**.
2. Enable Google Provider.
3. Add your **Client ID** and **Client Secret** from Google Cloud Console.
4. In Supabase Auth URL Configuration, keep exactly these three entries and no Vercel aliases:
   - `com.zikr.app://auth/callback`
   - `http://localhost:3000/**`
   - `https://zikrmediaofficial.vercel.app/auth/callback`

### Database
Supabase SQL migrations are the single official database migration path for this project. All deployable SQL lives in `supabase/migrations`. The application does not use Drizzle or a direct PostgreSQL URL at runtime.

Run the canonical database migration command only from an authenticated Supabase CLI environment when migrations are intentionally pending:

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
| `GEMINI_MODEL` | Optional: Gemini model name, default `gemini-2.5-flash-lite` |

## 3. Pre-deployment Validation

Before deploying, run:

```bash
pnpm deploy:check
pnpm check
pnpm build
```

`pnpm deploy:check` intentionally prints only variable names and pass/fail results; it does not print secret values. Fix any ❌ failures before deploying. ⚠️ warnings identify optional integrations or migration-only values that may still be needed for the full production setup.


## 4. Features Status

- **Quran**: The reader uses the Git-tracked Quran corpus first; Supabase remains the compatibility/content layer where applicable.
- **Tafsir**: Integrated into Ayah detail pages.
- **Hadith**: Connected to live API with pagination.
- **Stories**: Integrated with YouTube embed support.
- **Auth**: Google OAuth and Email/Password ready.

## 5. GitHub Sync
Push the latest changes to your repository:
```bash
git add .
git commit -m "chore: deploy verified source changes"
git push origin main
```
