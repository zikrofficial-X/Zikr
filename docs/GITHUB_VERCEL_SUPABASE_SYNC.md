# GitHub + Vercel + Supabase Sync Guide

This document explains how the project integrates GitHub, Vercel, and Supabase for seamless deployment and database synchronization.

## Architecture Overview

```
GitHub Repository (main branch)
    ↓ (git push)
    ↓ → Vercel (automatic deployment)
    ↓    ├─ Build Phase: Next.js compilation + type checking
    ↓    ├─ Environment Variables: Injected by Vercel
    ↓    └─ Deployment: Auto-scales and goes live
    ↓
Vercel Environment
    ↓ (SUPABASE_* env vars)
    ↓ → Supabase (PostgreSQL database + Auth)
    ↓    ├─ Database: Stores all app data
    ↓    ├─ Auth: Google OAuth + session management
    ↓    └─ RLS Policies: Row-level security
    ↓
Live Application
    ├─ Frontend: Next.js React app
    ├─ Backend: Next.js API routes + Server Components
    ├─ Database: Supabase PostgreSQL
    └─ Auth: Supabase Auth system
```

## Step 1: Connect GitHub to Vercel

### If not already connected:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Select "Import Git Repository"
4. Authorize Vercel to access your GitHub account
5. Select the `mohamedalaa7785-cpu/Zikr` repository
6. Click "Import"

### If already connected:

- The project should appear in your Vercel dashboard
- Any push to the `main` branch triggers an automatic deployment

## Step 2: Configure Vercel Environment Variables

1. Open your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add the following variables for ALL environments (Production, Preview, Development):

### Required Variables:

| Variable | Source | Example |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings > API | `https://abcdef.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings > API | `eyJhbGc...` (public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings > API | `eyJhbGc...` (secret key) |
| `DATABASE_URL` | Supabase Database Settings | `postgresql://postgres:pw@db.xxx.supabase.co:5432/postgres` |
| `NEXT_PUBLIC_SITE_URL` | Your domain | `https://your-domain.vercel.app` |
| `AUTH_CALLBACK_URL` | Same as SITE_URL + /auth/callback | `https://your-domain.vercel.app/auth/callback` |

### Optional Variables:

- `GEMINI_API_KEY` - For AI features
- `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` - For video content
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - For OAuth (if enabling)

**Important**: Use the environment selector to add variables to **all environments**. Set "Environments" to include Production, Preview, and Development.

## Step 3: Configure Supabase

### Get Your Credentials:

1. Go to [Supabase Console](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API** to find:
   - Project URL (use for `NEXT_PUBLIC_SUPABASE_URL`)
   - Anon Key (use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service Role Key (use for `SUPABASE_SERVICE_ROLE_KEY`) - **Keep this secret!**

### Get Database Connection String:

1. Go to **Settings** → **Database** → **Connection Pooling**
2. Select Mode: **Transaction** (recommended for Vercel)
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your database password
5. Use for `DATABASE_URL` in Vercel

### Optional: Configure Google OAuth

1. Go to **Authentication** → **Providers** → **Google**
2. Click "Enable Google Provider"
3. Add your Google OAuth credentials (from Google Cloud Console)
4. In **Redirect URLs**, add:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.vercel.app/auth/callback`
   - **Do NOT use** `/api/auth/callback` (this uses app router)

## Step 4: Apply Database Migrations

### Local Development:

```bash
# Set DATABASE_URL in your local .env file first
echo "DATABASE_URL=your-connection-string" > .env.local

# Run migrations
pnpm db:migrate:supabase
```

### On Vercel (Automatic):

The migrations in `supabase/migrations/` are automatically applied when:
1. You push to GitHub
2. Vercel starts the build process
3. Database URL is configured in environment variables

If migrations don't apply automatically, run them manually:

```bash
# On your local machine with DATABASE_URL set:
pnpm db:migrate:supabase
```

## Step 5: Verify Deployment

### Check Vercel Deployment:

1. Go to Vercel project dashboard
2. Look for the latest deployment (should show ✅ "Ready")
3. Click "Visit" to see your live app

### Check Environment Variables:

1. Open your app in production
2. The home page should load without errors
3. If you see "Environment variable validation failed" in logs:
   - Go back to Vercel Settings > Environment Variables
   - Verify all required variables are set
   - Redeploy (Settings > Deployments > Redeploy)

### Validate Configuration:

```bash
# Run validation script (requires DATABASE_URL set locally)
pnpm deploy:check
```

Expected output should show:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ Supabase REST API reachable

## Step 6: Deploy Across All Services

### Automatic Deployment (Recommended):

```bash
git add .
git commit -m "Fix: Supabase + Vercel sync configuration"
git push origin main
```

This triggers:
1. GitHub receives push
2. Vercel detects change and starts build
3. Next.js compiles with Vercel env vars
4. Deployment goes live in ~2-3 minutes

### Manual Redeploy on Vercel:

If you need to force a redeployment (e.g., after updating env vars):

1. Go to Vercel project dashboard
2. Click **Deployments**
3. Find latest deployment
4. Click **...** menu → **Redeploy**

This ensures new environment variables are picked up.

## Troubleshooting Sync Issues

### Problem: Build fails with "Environment variable validation failed"

**Solution**:
1. Check Vercel Settings > Environment Variables
2. Ensure all REQUIRED variables are set (not empty)
3. Redeploy: Go to Deployments > Redeploy latest

### Problem: Supabase REST API returns 401 Unauthorized

**Solution**:
1. Check NEXT_PUBLIC_SUPABASE_URL is correct
2. Check NEXT_PUBLIC_SUPABASE_ANON_KEY matches your Supabase project
3. In Supabase: Settings > Authentication > ensure API keys are enabled

### Problem: Database connection fails (migrations don't apply)

**Solution**:
1. Verify DATABASE_URL is set correctly in Vercel
2. Check password is URL-encoded (e.g., `@` → `%40`)
3. Ensure database firewall allows Vercel IP ranges
4. Run locally first: `DATABASE_URL=... pnpm db:migrate:supabase`

### Problem: GitHub changes don't trigger Vercel deployment

**Solution**:
1. Go to Vercel Settings > Deployments
2. Check Git Connection shows your GitHub repo
3. If disconnected, click "Reconnect"
4. Make a new commit and push to trigger build

### Problem: Errors in production but works locally

**Solution**:
1. Check Vercel Deployments > Build Logs for errors
2. Environment variables might not be set in production
3. Add missing vars to Vercel Settings > Environment Variables
4. Redeploy after adding variables

## Testing the Full Sync

### Test 1: Local Development

```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials
npm install
npm run dev
# Visit http://localhost:3000
```

### Test 2: GitHub Push

```bash
git add .
git commit -m "test deployment"
git push origin main
# Watch Vercel dashboard for automatic deployment
```

### Test 3: Verify Production

1. Visit your Vercel deployment URL
2. Check browser console for any errors
3. Try authentication flow (if configured)
4. Verify data loads from Supabase

## Database Schema & RLS

All database tables are created via SQL migrations in `supabase/migrations/`:

- Schema is applied automatically
- Row-Level Security (RLS) policies protect data
- Users can only see their own private data
- Admin users have full access (when configured)

Never modify schema through Supabase UI directly. Instead:

1. Create new migration file
2. Add SQL to `supabase/migrations/`
3. Push to GitHub
4. Migrations auto-apply to production

## File Structure for Sync

```
project/
├── .github/
│   └── workflows/           # GitHub Actions (if used)
├── supabase/
│   ├── migrations/          # SQL migrations (auto-applied)
│   └── config.json          # Supabase project config
├── lib/
│   ├── env.ts              # Environment validation
│   ├── env-validation.ts   # Env schema (Zod)
│   └── supabase/
│       ├── server.ts       # Server-side Supabase client
│       └── client.ts       # Browser Supabase client
├── drizzle.config.ts       # Database config for migrations
├── .env.example            # Env vars template
├── DEPLOYMENT_GUIDE.md     # This file
└── vercel.json             # Vercel configuration
```

## Next Steps

1. ✅ Ensure Vercel environment variables are set (Step 2)
2. ✅ Verify Supabase credentials are correct (Step 3)
3. ✅ Apply database migrations (Step 4)
4. ✅ Test deployment (Step 5)
5. ✅ Verify everything works in production (Step 6)

Once all steps are complete, the app will automatically deploy and sync whenever you push to the main branch on GitHub.

## Questions or Issues?

- Check logs: Vercel Deployments > select deployment > View Logs
- Verify env vars: Vercel Settings > Environment Variables
- Test database: Connect to Supabase PostgreSQL directly
- GitHub sync: Check repository connection in Vercel > Settings > Git
