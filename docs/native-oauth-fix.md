# Native Google OAuth callback flow

ZIKR native builds use the direct application deep link:

`com.zikr.app://auth/callback`

The external Google authentication still runs through Supabase Auth. Google's OAuth client uses the Supabase provider callback:

`https://eydxvcamhjhajxjrsgym.supabase.co/auth/v1/callback`

Supabase then redirects to the application deep link because it is present in the Supabase Auth Redirect URLs allowlist. Supabase supports mobile deep-link redirect targets in this configuration.

The Capacitor handler listens for `appUrlOpen`, retrieves the callback URL, validates the exact deep-link pathname `/callback`, and exchanges the authorization code with the PKCE verifier stored by the browser Supabase client.

For older installs, the handler also accepts the HTTPS application callback:

`https://zikrmediaofficial.vercel.app/auth/callback`

The custom scheme should **not** be added as Google's OAuth provider callback URI. It belongs in the Supabase application redirect allowlist.

The Android activity remains responsible for passing the latest deep-link intent to Capacitor so the WebView can receive the callback.
