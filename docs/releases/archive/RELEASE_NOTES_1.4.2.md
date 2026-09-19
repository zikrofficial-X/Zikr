# ZIKR Android 1.4.2

## OAuth / Google sign-in

- Harden native Google OAuth callback delivery on Android.
- Handle Capacitor App URL callbacks and cold-start launch URLs.
- Ensure the native OAuth code is exchanged with the in-app PKCE verifier.
- Close the external browser after the native callback is consumed.
- Explicitly register the Capacitor Browser plugin on Android.

## Release validation

- Android application id: `com.zikr.app`
- Android version: `1.4.2`
- Release artifacts: signed APK and AAB
