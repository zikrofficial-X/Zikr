# ZIKR v1.4.2 Release Notes

## Native Android Google OAuth
- Open Google OAuth with Capacitor Browser.
- Redirect native authentication directly to `com.zikr.app://auth/callback`.
- Receive the callback with Capacitor App URL handling.
- Exchange the authorization code in the app using the stored PKCE verifier.
- Close the external browser after successful callback.
- Handle cold-start and app-resume callback delivery.

## Android
- Capacitor Browser plugin explicitly registered.
- `singleTask` activity forwards the new OAuth intent via `onNewIntent()`.

## Release identity
- Application ID: `com.zikr.app`
- Version name: `1.4.2`
- Version code: `33`
