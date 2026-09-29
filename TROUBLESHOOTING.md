# ZIKR Troubleshooting Guide

This file reflects the current authentication and deployment architecture. It replaces older debugging examples that referenced the former `app/` and `lib/` layouts.

## Google OAuth

ZIKR uses Supabase Auth with PKCE.

Application callback URLs:
- Browser: `https://zikrmediaofficial.vercel.app/auth/callback`
- Native: `com.zikr.app://auth/callback`
- Local: `http://localhost:3000/auth/callback`

Google's OAuth client uses the Supabase provider callback:

`https://kdotmrjfecgafiommzwz.supabase.co/auth/v1/callback`

Do not replace the Supabase provider callback with the application callback in Google's OAuth client.

### Error: "Unsupported provider: provider is not enabled"

Enable Google under Supabase Authentication → Sign In / Providers → Google and configure the Google Client ID and Client Secret there. The application does not require Google provider secrets in Vercel.

### Error: "redirect_uri_mismatch"

For Supabase-managed Google login, the Google OAuth client must contain the exact Supabase provider callback shown by the project. The application's final redirect is controlled by Supabase Auth Redirect URLs.

### Native app returns to the browser

Verify that `com.zikr.app://auth/callback` exists in:
- `supabase/config.toml`
- `capacitor.config.json`
- Android intent filters
- iOS URL schemes

The native OAuth handler in `src/components/layout/native-google-oauth-handler.tsx` owns the native authorization-code exchange.

## Vercel build failures

Check the latest deployment status and build log first. The repository's Vercel build command is:

```text
pnpm install --frozen-lockfile
pnpm build
```

Do not treat an older READY production deployment as proof that the current finalization branch builds.

For the current finalization work, the connected Vercel account is returning a build-rate-limit/account gate. A fresh successful deployment of the corrected finalization HEAD is therefore still required.

## Supabase issues

Live database verification requires an authenticated Supabase project with SQL access. The repository migration source is `supabase/migrations/`.

Use:

```bash
pnpm supabase:migrations:check
pnpm supabase:migrations:replay
```

Never reset production migration history simply to make local filenames match.

## Offline issues

The service worker does not cache arbitrary HTML automatically. To prepare the full public offline experience:

1. Open `/offline-library` while online.
2. Run the full offline-pack action.
3. Wait for dataset and route validation to complete.
4. Test again with network disabled.

Private/admin/auth routes are intentionally excluded.

## Mobile build issues

The native runtime packages are Capacitor 7.x. The repository currently carries a Capacitor CLI 8.5.1 lock-aligned dependency while native projects reference the 7.x runtime. Do not change that major version without refreshing the lockfile and running a real native sync/build.

For Android:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm exec cap sync android
cd android
./gradlew assembleDebug
```

For iOS:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm exec cap sync ios
```

The iOS Podfile is maintained against the locked Capacitor plugin versions; rerun `cap sync ios` after dependency changes.

## Security rules during troubleshooting

Never disable RLS, authentication, OAuth validation, or canonical-origin checks just to make a route or build pass. Never paste service-role keys, OAuth refresh tokens, Facebook access tokens, VAPID private keys, or Android signing material into source files or public logs.
