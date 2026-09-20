# 🚀 Quick Start: Complete Your Supabase + Vercel Sync

> **Status**: Code fixes ✅ complete | **Next**: Add Supabase credentials to Vercel (5 min)

## The Situation

Your Zikr project is set up correctly but missing environment variables in Vercel. The code now handles this gracefully—it won't crash during deployment, just won't have database connectivity until vars are added.

## What To Do (5 minutes)

### 1️⃣ Get Supabase Credentials (2 min)

Go to [app.supabase.com](https://app.supabase.com) → Select your project → Settings > API

Copy these 3 values:
- **Project URL** → looks like `https://abc123.supabase.co`
- **Anon Key** → long string starting with `eyJ...`
- **Service Role Key** → long string, KEEP SECRET

Migrations are managed exclusively through the Supabase migration chain; do not provision a `DATABASE_URL` for application runtime.

### 2️⃣ Add to Vercel (2 min)

Go to [Vercel Dashboard](https://vercel.com) → Select your Zikr project → Settings > Environment Variables

Click "Add New" and create these variables for **ALL environments**:

```
NEXT_PUBLIC_SUPABASE_URL = [Your Project URL from step 1]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [Your Anon Key from step 1]
SUPABASE_SERVICE_ROLE_KEY = [Your Service Role Key from step 1]
NEXT_PUBLIC_SITE_URL = https://zikrmediaofficial.vercel.app
AUTH_CALLBACK_URL = https://zikrmediaofficial.vercel.app/auth/callback
```

⚠️ **Keep `NEXT_PUBLIC_SITE_URL` and `AUTH_CALLBACK_URL` exactly identical across environments**. Supabase credentials are required in environments where the app is executed.

### 3️⃣ Redeploy (30 sec)

Go to Vercel Dashboard → Deployments → Click latest deployment → Click "Redeploy"

Wait for it to finish (~2 min)

### 4️⃣ Test (1 min)

Visit your Vercel URL → It should load without errors ✅

## What Just Happened?

- ✅ GitHub code has the canonical URL and architecture checks
- ⏳ **Deployment**: Vercel build capacity/account limits may block a new deployment even when the repository is valid.

## If Something Goes Wrong

### Build still fails?
- Check Vercel Deployments > Build Logs
- Make sure the 5 required variables from step 2 are set
- Try redeploy again

### App loads but nothing works?
- Check browser console (F12)
- Do not add a direct database connection string; use Supabase migration tooling for schema changes.
- Verify Supabase project is active

### Need help?
- Read: `DEPLOYMENT_CHECKLIST.md` (detailed deployment gate)
- Read: `GITHUB_VERCEL_SUPABASE_SYNC.md` (full technical guide)
- Check: Vercel build logs for exact error

## After This Works

You'll have:
- ✅ GitHub → Vercel deployment remains configured by the connected project
- ✅ Database connection to Supabase
- ✅ Auth system working
- ✅ All app features functional
- ✅ Clean separation of concerns (GitHub code, Vercel build, Supabase data)

**That's it. You're 5 minutes away from production-ready Supabase + Vercel sync.**
