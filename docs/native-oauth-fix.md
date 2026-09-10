# Native OAuth callback flow

For native Android, ZIKR starts Google OAuth with the production HTTPS callback bridge (`/auth/callback?native=1`). The bridge does not exchange the code; it forwards the authorization code to `com.zikr.app://auth/callback`. The app receives the code through Capacitor App, exchanges it with the PKCE verifier stored by the WebView Supabase client, closes the external browser, and navigates to the requested page. This avoids leaving the user on the Vercel/Supabase page and keeps the session in the app.

The Android activity is `singleTask`, so `onNewIntent()` preserves the latest deep-link intent for Capacitor. The web handler registers `appUrlOpen` before checking `getLaunchUrl()` at startup and whenever the app becomes active. It also accepts the production HTTPS callback as a compatibility fallback for already-installed older APKs.
