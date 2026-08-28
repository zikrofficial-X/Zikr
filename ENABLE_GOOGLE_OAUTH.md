# How to Enable Google OAuth in Your ZIKR App

## Problem
When clicking the Google login button, you get this error:
```
"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"
```

This means **Google OAuth is not enabled** in your Supabase project yet.

## Solution: Enable Google OAuth in Supabase

### Step 1: Get Your Supabase Project Details
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (you should see it listed)
3. Go to **Authentication** → **Providers** → **Google**
4. Note your **Supabase Callback URL** - it looks like: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### Step 2: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click on it and press **Enable**

4. Create OAuth Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **+ Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Name it something like "ZIKR App"
   - Add **Authorized redirect URIs**:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   - Click **Create**
   - Copy your **Client ID** and **Client Secret**

### Step 3: Add Credentials to Supabase

1. Go back to [Supabase Dashboard](https://app.supabase.com)
2. Go to **Authentication** → **Providers** → **Google**
3. Turn **ON** the toggle (enable the provider)
4. Paste your **Google Client ID** from Step 2
5. Paste your **Google Client Secret** from Step 2
6. Click **Save**

### Step 4: Test the Flow

1. Open `http://localhost:3000/auth/login` in your browser
2. Scroll down and click **"المتابعة باستخدام Google"** (Continue with Google)
3. You should now be redirected to Google login
4. After signing in with Google, you'll be redirected back to your app
5. Check the console (F12) for logs starting with `[oauth]` and `[auth/callback]`

## What Happens Behind the Scenes

### Login Flow
```
[oauth] Starting Google login with redirectUri: http://localhost:3000/auth/callback?next=/profile
↓
Google OAuth Redirect
↓
[oauth] Google OAuth initiated successfully
↓
User clicks "Sign in with Google"
↓
User consents to permissions
↓
Google redirects to: http://localhost:3000/auth/callback?code=AUTH_CODE
```

### Callback Flow
```
[auth/callback] Processing callback with code: true, path: /profile
↓
[auth/callback] Exchanging code for session...
↓
[auth/callback] User authenticated: USER_ID, user@example.com
↓
[auth/callback] Profile upserted successfully
↓
[auth/callback] Redirecting to: /profile
```

## Troubleshooting

### Error: "Unsupported provider: provider is not enabled"
- **Cause**: Google OAuth is not enabled in Supabase
- **Fix**: Follow Steps 1-3 above to enable it

### Error: "redirect_uri_mismatch"
- **Cause**: The redirect URI in Google Cloud doesn't match Supabase callback URL
- **Fix**: Make sure both have the exact same URL

### Error: "Invalid client ID"
- **Cause**: Wrong or expired credentials
- **Fix**: Verify your Client ID in Google Cloud Console and Supabase

### Error: "Profile upsert error"
- **Cause**: The `profiles` table doesn't exist
- **Fix**: Run the database migration (see setup instructions)

### The button doesn't redirect anywhere
- **Cause**: May be a CORS or network issue
- **Fix**: 
  1. Open browser console (F12)
  2. Look for errors
  3. Check the `[oauth]` logs
  4. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

## Environment Variables Check

Make sure these are set in your `.env.development.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
AUTH_CALLBACK_URL=http://localhost:3000/auth/callback
```

## Production Deployment

When deploying to production:

1. Update Google OAuth credentials:
   - Add your production callback URL to Google Cloud Console:
     ```
     https://your-app.com/auth/callback
     ```

2. Update Supabase settings if needed (usually auto-populated)

3. Set environment variables in Vercel:
   - Go to **Settings** → **Environment Variables**
   - Add the same variables as above, but with production URLs

## Code Changes Made

The following improvements were added to handle OAuth better:

### `app/auth/google-oauth-button.tsx`
- Added comprehensive logging for debugging
- Enhanced OAuth options with `offline` access and `consent` prompt
- Better error handling and user feedback

### `app/auth/callback/route.ts`
- Added step-by-step logging through the callback process
- Made profile updates graceful (won't break auth if profile insert fails)
- Better error messages with Arabic translations

These changes make it easy to debug any issues that occur during the OAuth flow.

## Support

If you still have issues:
1. Check the browser console (F12) for `[oauth]` and `[auth/callback]` logs
2. Check your Supabase project logs
3. Verify all URLs match exactly
4. Make sure Google OAuth is toggled ON in Supabase
