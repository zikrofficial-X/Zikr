# ZIKR Authentication System Guide

## Authentication architecture

ZIKR uses Supabase Auth for email/password and Google OAuth. Browser OAuth uses PKCE and a dedicated Next.js callback route. Native Capacitor builds use the `com.zikr.app://auth/callback` deep link.

### Canonical files

- `src/app/auth/login/page.tsx`
- `src/features/auth/components/google-oauth-button.tsx`
- `src/features/auth/integrations/google-oauth.ts`
- `src/app/auth/callback/route.ts`
- `src/components/layout/native-google-oauth-handler.tsx`
- `src/lib/auth-enhanced.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`

There are no canonical auth files under root `app/` or root `lib/`.

## Browser Google OAuth

The browser callback is:

`https://zikrmediaofficial.vercel.app/auth/callback`

The Google OAuth provider callback is:

`https://eydxvcamhjhajxjrsgym.supabase.co/auth/v1/callback`

These are intentionally different.

Supabase's Google provider configuration uses the project callback URL at `/auth/v1/callback`; the application's `redirectTo` is controlled by the Supabase Auth Redirect URLs allowlist. citeturn167534search0turn167534search1

The app validates `next` as an internal relative path to prevent open redirects.

## Native Google OAuth

Native builds use:

`com.zikr.app://auth/callback`

The custom scheme is an application redirect target, not Google's provider callback. The native handler performs the authorization-code exchange with the same browser Supabase client that created the PKCE verifier.

## Session and profile handling

The callback exchanges the authorization code through Supabase SSR, then performs a service-side profile upsert. The profile write is deliberately best-effort so a database-side profile issue does not turn a valid authentication into a false login failure.

Protected application areas are guarded by `proxy.ts` and Supabase's authenticated-user lookup.

## Security properties

- Relative-path validation blocks open redirects.
- OAuth start responses are `no-store`.
- PKCE verifier failures lead to a clean restart.
- Service-role credentials are server-only.
- Provider credentials are not stored in source control.
- Native callback matching requires the exact `/callback` pathname.

## Environment variables

Required runtime values:

`NEXT_PUBLIC_SUPABASE_URL`

`NEXT_PUBLIC_SUPABASE_ANON_KEY`

`NEXT_PUBLIC_SITE_URL`

Optional server integrations such as Google/YouTube or Facebook publishing have separate credentials and are not interchangeable with Supabase Auth.

## Current configuration

The local Supabase Auth URL configuration is in `supabase/config.toml`:

- production site URL: `https://zikrmediaofficial.vercel.app`
- browser callback: `https://zikrmediaofficial.vercel.app/auth/callback`
- local callback: `http://localhost:3000/auth/callback`
- native callback: `com.zikr.app://auth/callback`

The hosted Google provider being enabled is a Dashboard setting. Repository files cannot prove that the hosted provider toggle and its Client ID/Secret are currently enabled, so that state must be checked in Supabase Authentication → Sign In / Providers → Google.

## Testing

Use the pure auth tests under `__tests__/integration/auth.test.ts` and the native callback test under `__tests__/unit/native-google-oauth-handler.test.ts`.

Then run the full verification suite with `pnpm verify`.
