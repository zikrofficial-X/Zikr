# Monetag SmartLink Placement

## Canonical link

The configured external SmartLink is:

`https://uplcm.com/4/12171895`

Its UI label must clearly identify it as an advertisement or external sponsored link. Do not describe it as a donation, direct support payment, Quran/Hadith resource, or guaranteed reward.

## Website placements

The disclosed link is placed in:
- The homepage promotional section.
- The public video hub.
- The shared footer on eligible general public pages.

The footer placement is suppressed on administration/authentication, child-directed, sacred-text, worship-tool, and individual video-detail routes. Keep the external link separate from Quran, Hadith, dua, adhkar, prayer, Qibla, and children's learning interfaces.

The link opens a new tab and uses `rel="nofollow sponsored noopener noreferrer"`. Its disclosure explains that the destination may be a third-party offer or website.

## Native Android/iOS applications

Monetag is website-only. Native Capacitor shells must not load Monetag tag scripts,
the Monetag service-worker import, or Monetag SmartLink placements. The shared
root layout contains no Monetag loader; `WebAdvertisingRuntime` exits immediately
when `Capacitor.isNativePlatform()` is true. SmartLink promotional components
and the shared footer link are hidden in native shells.

The native app registers `/sw.js?native=1`. That worker keeps ZIKR offline
content and notification handlers but skips Monetag's third-party
`importScripts` integration. On activation it removes cached HTML containing
legacy Monetag markup without deleting the user's offline Quran/audio library.
AdSense remains separately disabled in Capacitor through its existing native
runtime guard. These exclusions apply to newly rebuilt APK/AAB artifacts; a
previously installed build must receive the updated app/web runtime and worker
before its old advertising integration can be removed.

## Canonical-host restriction

Monetag tags and the Monetag service-worker import are permitted only on the
canonical production origin. The browser registers `/sw.js?monetag=1` only
when the current hostname exactly matches the canonical host. Vercel Preview,
staging aliases, and local development register `/sw.js` without Monetag.
The worker independently checks both the marker and canonical hostname before
calling `importScripts`; a failed third-party import is non-fatal so offline
caching and notification handlers can still install. Non-canonical and native
workers remove only cached HTML that contains legacy advertising markup.

The website continues to use its approved, disclosed Monetag placements.

## Social video metadata

Social captions use approved platform metadata. Monetag SmartLinks remain website-only and are not appended to YouTube descriptions, Facebook/Reels captions, or any external platform metadata. Existing historical posts are not edited or republished.

## Publishing behavior

The SmartLink is rendered only in the approved website placements above. Social publishing uses a separate approval-gated workflow with no SmartLink injection. This website advertising placement does not change historical social queue records.

## Verification

Run:

```bash
pnpm social:publish:check
pnpm check
pnpm lint
pnpm build
```
