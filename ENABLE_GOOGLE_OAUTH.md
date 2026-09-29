# ZIKR — Google OAuth Configuration

## Canonical production flow

ZIKR uses Supabase Auth with PKCE.

**Browser**
1. ZIKR calls `supabase.auth.signInWithOAuth({ provider: "google", redirectTo: "https://zikrmediaofficial.vercel.app/auth/callback" })`.
2. Supabase sends the user to Google.
3. Google sends the authorization response to the **Supabase provider callback**:
   `https://kdotmrjfecgafiommzwz.supabase.co/auth/v1/callback`.
4. Supabase validates the provider response and redirects to ZIKR's app callback.
5. `src/app/auth/callback/route.ts` exchanges the PKCE code for the user session and redirects to the safe `next` path.

**Native Android/iOS**
1. The app starts the same Supabase Google OAuth flow.
2. The redirect target is the registered deep link `com.zikr.app://auth/callback`.
3. The native Capacitor handler receives `appUrlOpen` and performs the PKCE code exchange inside the app.
4. The app returns to the requested internal route.

Supabase's current Google setup documentation uses the Supabase project's `/auth/v1/callback` as the Google OAuth client's redirect URI, while the application's post-login URL is configured in Supabase Auth Redirect URLs.

## Supabase configuration

Production Site URL:

`https://zikrmediaofficial.vercel.app`

Allowed application redirect URLs:

`https://zikrmediaofficial.vercel.app/auth/callback`

`http://localhost:3000/auth/callback`

`com.zikr.app://auth/callback`

The source-of-truth local configuration is `supabase/config.toml`.

## Google Auth Platform configuration

Create a **Web application** OAuth client.

Authorized JavaScript origins:

`https://zikrmediaofficial.vercel.app`

For local development only:

`http://localhost:3000`

Authorized redirect URI:

`https://kdotmrjfecgafiommzwz.supabase.co/auth/v1/callback`

Do **not** use `https://zikrmediaofficial.vercel.app/auth/callback` as Google's provider callback for the Supabase-managed social-login flow.

For local Supabase CLI development, use the local Supabase callback shown by the local Supabase project instead of the production project callback.

## Credentials

Put the Google OAuth Client ID and Client Secret in the Supabase Dashboard under Authentication → Sign In / Providers → Google.

Never commit the client secret.

The application does not need `GOOGLE_CLIENT_SECRET` just to sign users in through Supabase Auth. Google API credentials used by YouTube are a separate integration and must not be confused with the Supabase Auth provider credentials.

## Code ownership

The canonical auth files are:

- `src/features/auth/components/google-oauth-button.tsx`
- `src/features/auth/integrations/google-oauth.ts`
- `src/app/auth/callback/route.ts`
- `src/components/layout/native-google-oauth-handler.tsx`
- `src/lib/auth-enhanced.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`

Do not recreate old `app/auth/*`, `lib/*`, or duplicate Google button implementations.

## Troubleshooting

**Unsupported provider**
Google is disabled in the Supabase Authentication provider settings.

**redirect_uri_mismatch**
The Google OAuth client must contain the exact Supabase provider callback URI. Supabase's own redirect allowlist controls the final redirect back to the ZIKR app.

**PKCE verifier missing**
Restart the OAuth flow from ZIKR. The callback deliberately treats missing/expired PKCE state as a recoverable OAuth restart.

**Native app returns to Chrome**
Verify that `com.zikr.app://auth/callback` is present in the Supabase Auth redirect allowlist and that the installed app is using the current Capacitor configuration.

**Profile row missing**
Profile creation is best-effort after successful authentication. Authentication is not invalidated when a profile write fails.

## Verification

Run:

`pnpm verify`

The verification suite checks project paths, local imports, content integrity, migrations, mobile configuration, auth/security-sensitive configuration, lint, typecheck, and the production build. The current repository has no checked-in automated test suite; browser/native OAuth still requires a real end-to-end session test before release.
