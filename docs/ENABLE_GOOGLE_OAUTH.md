# ZIKR — Google OAuth Configuration

## Canonical production origins

Production application URL:

`https://zikrmediaofficial.vercel.app`

Production Supabase project:

`ymxdswkaxafakugktsim`

The Google OAuth provider callback for this Supabase project is:

`https://ymxdswkaxafakugktsim.supabase.co/auth/v1/callback`

Do not use a callback from an old Supabase project.

## Browser and iOS flow

1. ZIKR calls `supabase.auth.signInWithOAuth({ provider: "google", redirectTo })`.
2. Supabase sends the user to Google.
3. Google redirects to the Supabase provider callback above.
4. Supabase redirects to ZIKR's application callback.
5. The web callback exchanges the PKCE code for the session. Native iOS uses the HTTPS callback bridge and Capacitor deep link when required.

## Android native flow

Recent Android binaries include `@capgo/capacitor-social-login` and use Google Credential Manager:

1. `SocialLogin.initialize({ google: { webClientId } })` receives the **Web application OAuth client ID**.
2. `SocialLogin.login({ provider: "google" })` returns a Google ID token.
3. ZIKR passes that ID token to `supabase.auth.signInWithIdToken()`.

Two OAuth client types must exist in the **same Google Cloud project**:

| Client type | Purpose | Configuration |
|---|---|---|
| Web application | ID-token audience / Supabase provider | Store the Web client ID in `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` and configure the same client ID + secret in Supabase Auth → Google |
| Android | Authorizes the installed Android package/signing certificate | Create one Android client for each signing certificate, with package `com.zikr.app` and the matching SHA-1 |

Never pass the Android client ID to `webClientId`. The code must receive the Web client ID.

Register every signing certificate that can sign an installed build:

- Debug builds: SHA-1 from `cd android && ./gradlew signingReport`.
- Sideloaded release builds: SHA-1 from the exact APK installed, using `keytool -printcert -jarfile app-release.apk`.
- Google Play builds: Play Console → Test and release → Setup / App integrity → App signing key certificate. Register this SHA-1 as an additional Android OAuth client even when the upload-key SHA-1 is already registered.

The Android OAuth client package name must exactly equal `com.zikr.app`. If Google Auth Platform consent is in Testing mode, add the account used for testing under Audience → Test users.

## Older Android APK compatibility

Capacitor's `server.url` loads the live website inside the installed native shell. Therefore, the web bundle can be newer than the native APK. The Google button must call Credential Manager only when:

`Capacitor.isPluginAvailable("SocialLogin")`

If the installed APK does not contain the native plugin, use the browser PKCE bridge instead:

`https://zikrmediaofficial.vercel.app/auth/callback?native=1`

The callback returns to `com.zikr.app://auth/callback`, where `NativeGoogleOAuthHandler` exchanges the PKCE code. Do not remove this compatibility path while older APKs remain in use.

If Credential Manager fails on a newer binary, offer the browser PKCE flow as a user-selectable fallback rather than reporting that Supabase is necessarily misconfigured.

## Supabase configuration

Production Site URL:

`https://zikrmediaofficial.vercel.app`

Allowed application redirect URLs:

- `https://zikrmediaofficial.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`
- `com.zikr.app://auth/callback`

The source-of-truth local configuration is `supabase/config.toml`.

The Google OAuth Web client must include the exact Supabase provider callback URI as an Authorized redirect URI:

`https://ymxdswkaxafakugktsim.supabase.co/auth/v1/callback`

For the web client, configure the production JavaScript origin:

`https://zikrmediaofficial.vercel.app`

For local development only, also use `http://localhost:3000` and the local Supabase callback from the local project.

## Credentials and security

Put the Google OAuth Web Client ID and Client Secret in Supabase Dashboard → Authentication → Sign In / Providers → Google.

The public Web client ID used by the Android plugin is configured in Vercel as `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`. It must match the Web client configured in Supabase.

Never commit the Google client secret. YouTube API credentials are a separate integration and must not be confused with Supabase Auth credentials.

## Verification

Run:

- `pnpm auth:check`
- `pnpm auth:native:check`
- `pnpm mobile:check`
- `pnpm test`

A successful static check does not prove the Google Cloud Android SHA-1 registration is correct. Finish with an end-to-end test using the exact signed APK installed on a physical Android device.
