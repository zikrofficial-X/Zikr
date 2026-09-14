# Native OAuth callback flow

For native Android, ZIKR starts Google OAuth with the direct `com.zikr.app://auth/callback` redirect. The external Chrome Custom Tab returns the authorization code directly to the Capacitor Activity, where `appUrlOpen` is handled by the WebView and exchanged with the PKCE verifier stored by the browser Supabase client. The external browser is then closed and the user is navigated to the requested page inside the app.

The Android activity is `singleTask`, so `onNewIntent()` preserves the latest deep-link intent for Capacitor. The web handler registers `appUrlOpen` before checking `getLaunchUrl()` at startup and whenever the app becomes active. It also accepts the production HTTPS callback as a compatibility fallback for already-installed older APKs and web sessions.

The direct custom-scheme redirect must be present in Supabase Auth URL Configuration and in the Google OAuth client’s authorized redirect configuration where applicable. The production web callback remains `https://zikrmediaofficial.vercel.app/auth/callback` for browser sign-in.

This direct-return path avoids the extra HTTPS bridge redirect that could leave Android on the Google or Vercel page without delivering the callback to the app.
