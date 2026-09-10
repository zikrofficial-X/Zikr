# Native Google OAuth fix

Native Android OAuth must return directly to the registered application deep link (`com.zikr.app://auth/callback`). The web HTTPS callback bridge can leave the Custom Tab open on some Android/browser combinations. The native flow preserves the PKCE verifier in the app WebView, receives the authorization code through the deep link, exchanges it in the app, closes the Browser plugin, and then navigates to the requested path.
