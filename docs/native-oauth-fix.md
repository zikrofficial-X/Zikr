# Native OAuth callback flow

For native Android, ZIKR uses `com.zikr.app://auth/callback` as the Supabase Auth redirect URL. Supabase completes the Google provider callback on its HTTPS endpoint and then redirects to the app deep link. The app receives the authorization code through Capacitor App, exchanges it with the PKCE verifier stored by the browser Supabase client, closes the external browser, and navigates to the requested page.

The Android activity is `singleTask`, so `onNewIntent()` preserves the latest deep-link intent for Capacitor. The web handler also checks `getLaunchUrl()` at startup and whenever the app becomes active.
