# ZIKR Authentication System Guide

## Overview

Your app uses **Supabase Authentication** with Google OAuth. The system has two authentication flows:

1. **Email/Password Login** - Standard form-based auth
2. **Google OAuth** - Social login via Google

## Architecture

```
┌─ Browser ────────────────────────────────────────────────────────┐
│                                                                   │
│  Login Page (app/auth/login/page.tsx)                            │
│  ├─ Email/Password Form                                          │
│  └─ Google OAuth Button (GoogleOAuthButton component)            │
│                                                                   │
│  When user clicks Google button:                                 │
│  └─→ app/auth/google-oauth-button.tsx                           │
│      └─→ Supabase signInWithOAuth()                             │
│          └─→ Redirects to Google                                 │
│                                                                   │
│  After Google auth, redirects to:                                │
│  └─→ app/auth/callback/route.ts                                 │
│      └─→ Exchanges code for session                             │
│          └─→ Updates user profile                               │
│              └─→ Redirects to /profile or saved path            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Key Files

### 1. **app/auth/login/page.tsx**
The main login page component. Contains:
- Email/Password form
- Google OAuth button
- Sign up link
- Password recovery link

### 2. **app/auth/google-oauth-button.tsx**
Handles the Google OAuth flow:
- Builds the redirect URI
- Initiates OAuth with Supabase
- Handles errors and loading states
- Provides user feedback

**Key Code:**
```typescript
const { data, error: oauthError } = await client.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectUri,
    scopes: 'email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});
```

### 3. **app/auth/callback/route.ts**
Receives the OAuth callback from Google:
- Extracts the authorization code
- Exchanges it for a session
- Updates user profile in database
- Redirects to saved path or profile page

**Key Code:**
```typescript
const { data, error } = await supabase.auth.exchangeCodeForSession(code);

if (!error) {
  // Update user profile
  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    display_name: user.user_metadata?.full_name,
    avatar_url: user.user_metadata?.avatar_url,
  });
}
```

### 4. **lib/auth-enhanced.ts**
Utility functions for auth:
- `buildOAuthRedirectUri()` - Constructs the callback URL with state
- `extractNextPath()` - Extracts the return path from search params
- Session management utilities

### 5. **lib/supabase/client.ts**
Browser-side Supabase client:
- Creates singleton instance
- Handles environment variables
- Provides API for client components

### 6. **lib/supabase/server.ts**
Server-side Supabase client:
- Used in Server Components and Route Handlers
- Handles session from cookies
- Used in auth callback to verify sessions

## User Profile Schema

The `profiles` table stores user information:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

When a user signs in with Google, this table is auto-populated with:
- `id` - Supabase user ID
- `email` - From Google account
- `display_name` - From Google full_name
- `avatar_url` - From Google avatar_url

## Environment Variables

Required for authentication to work:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
AUTH_CALLBACK_URL=http://localhost:3000/auth/callback
```

## OAuth Flow Diagram

```
User clicks Google button
    ↓
App builds OAuth request with:
  - provider: 'google'
  - redirectTo: 'http://localhost:3000/auth/callback?next=/profile'
  - scopes: 'email profile'
    ↓
Supabase generates PKCE code challenge & verifier
    ↓
Redirects to Google with:
  - client_id
  - redirect_uri
  - scope
  - code_challenge (PKCE)
    ↓
User signs in with Google & consents
    ↓
Google redirects to callback URL with:
  - code (authorization code)
  - state (PKCE state)
    ↓
Callback route receives code
    ↓
Supabase exchanges code for JWT session:
  - Uses PKCE verifier
  - Gets JWT tokens
  - Sets httpOnly session cookie
    ↓
User profile is created/updated
    ↓
Redirects to /profile (or saved path)
    ↓
User is logged in!
```

## Session Management

### Browser Client
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
```

### Server Component
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { session } } = await supabase.auth.getSession();
```

### Protecting Routes
You can add middleware to protect routes:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session && request.nextUrl.pathname.startsWith('/profile')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}
```

## Error Handling

The auth system handles several types of errors:

### OAuth Errors
From Google or network issues:
```
error: 'access_denied' - User rejected permissions
error: 'server_error' - Google server error
```

### Callback Errors
During session exchange:
```
error_code: 'validation_failed' - Invalid code
error_code: 'invalid_grant' - Code expired
```

### Profile Errors
Database operations:
```
Fails gracefully if profile update fails
Doesn't prevent user login
```

All errors are logged with `[oauth]` or `[auth/callback]` prefixes for debugging.

## Testing

### Local Testing
1. Ensure Supabase is connected
2. Enable Google OAuth in Supabase
3. Open http://localhost:3000/auth/login
4. Click "المتابعة باستخدام Google"
5. Check browser console for logs

### Debugging
Open browser DevTools (F12) and look for logs starting with:
- `[oauth]` - OAuth button clicks
- `[auth/callback]` - Callback processing
- `[v0]` - Manual debug logs

## Production Deployment

### Vercel Deployment
1. Set environment variables in Vercel project settings
2. Add production callback URL to Google Cloud Console
3. Test the flow on production

### Supabase Production
1. Supabase handles this automatically
2. Just ensure Google OAuth is enabled
3. Use production Supabase URL and key

## Common Issues

| Issue | Solution |
|-------|----------|
| "provider is not enabled" | Enable Google OAuth in Supabase |
| "redirect_uri_mismatch" | URLs must match exactly |
| "Invalid client" | Check Client ID/Secret |
| "Session not created" | Check callback route logs |
| "Profile not updated" | Check database permissions |

## Next Steps

1. **Enable Google OAuth**: See `ENABLE_GOOGLE_OAUTH.md`
2. **Test the flow**: Open login page and try Google sign-in
3. **Monitor logs**: Check console for `[oauth]` and `[auth/callback]` messages
4. **Deploy**: Follow production deployment steps when ready
