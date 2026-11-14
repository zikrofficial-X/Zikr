# Native Google OAuth callback flow

ZIKR native Android OAuth starts from the canonical HTTPS application callback:

`https://zikrmediaofficial.vercel.app/auth/callback?native=1`

Supabase/Google completes the OAuth flow through the Supabase provider callback, then the application callback route forwards the authorization code to:

`com.zikr.app://auth/callback`

The Capacitor app receives the deep link through `appUrlOpen` / `getLaunchUrl`, exchanges the code with the PKCE verifier stored by the native WebView Supabase client, closes the external browser, and navigates to the requested page.

The Android manifest registers the custom-scheme callback only. The HTTPS callback remains in the external browser: it forwards the authorization code and optional PKCE flow id to the app's custom scheme, where the native WebView exchanges the code using the verifier it stored. The HTTPS callback is deliberately not registered as an Android App Link or iOS Universal Link.

The custom scheme remains in the Supabase Auth redirect allowlist for the final application handoff and for compatibility with older native builds.

The web flow continues to use:

`https://zikrmediaofficial.vercel.app/auth/callback`
