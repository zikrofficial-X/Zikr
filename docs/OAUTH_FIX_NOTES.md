# Native Google OAuth fix

Native Android OAuth starts at the canonical HTTPS application callback:

`https://zikrmediaofficial.vercel.app/auth/callback?native=1`

Supabase/Google completes the OAuth flow through the provider callback, and the application callback route forwards the authorization code and `sb_flow_id` to the registered application deep link:

`com.zikr.app://auth/callback`

The Capacitor native handler owns the final handoff, receives `appUrlOpen` / `getLaunchUrl`, exchanges the code with the WebView PKCE verifier, closes the external browser, and navigates to the requested path.

This two-step bridge is intentional: Google/Supabase start from a canonical HTTPS callback, while Android receives the final authorization code through the app deep link.

The production web callback remains:

`https://zikrmediaofficial.vercel.app/auth/callback`
