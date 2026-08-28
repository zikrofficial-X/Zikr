# Mobile audio source audit — 2026-08-22

## Adhan asset

- Source page: https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg
- Direct source: https://upload.wikimedia.org/wikipedia/commons/b/b0/Beautiful_adhan.ogg
- Author shown on the source page: Adam-synagda
- License shown on the source page: CC0 1.0 Universal Public Domain Dedication.
- The project uses a 25-second local excerpt converted to WAV/MP3 for notification limits and offline playback. The original source remains documented here.

## Salawat asset

- The bundled `salawat.wav` is a locally generated Arabic speech clip using the exact user-requested phrase `صل على سيدنا محمد` with the installed `espeak-ng` Arabic voice. No named reciter or copyrighted recording is represented.
- Existing remote `https://archive.org/download/salawat-menshawy/salawat-menshawy.mp3` was not bundled because the checked Internet Archive metadata did not expose a clear license or rights statement.

## Capacitor package verification

- The repository's `mobile/capacitor-dependencies.json` referenced `@capacitor-community/biometric-auth`, but npm returned 404 for that package name. The app does not currently import or call a biometric plugin; only the permission and config placeholder existed. This reference must be replaced or removed before native dependency installation.
- Sources checked: npm registry via `pnpm view` for `@capacitor-community/biometric-auth`, `@aparajita/capacitor-biometric-auth`, `capacitor-native-biometric`, and `@capgo/capacitor-native-biometric` on 2026-08-22.

## Important platform constraint

Custom notification audio is implemented through local notification sound files and Android channels. iOS notification sounds must be bundled in the app and are subject to Apple's notification-sound duration/format limits; a long full adhan should not be used directly as an iOS notification sound. Foreground playback can use the local clip, while scheduled background delivery uses the short bundled sound.
