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

## Social video metadata

External social publishing is retired. The SmartLink is not appended to YouTube descriptions, Facebook/Reels captions, or any other external platform metadata. Existing historical posts are not edited or republished.

## Publishing behavior

The SmartLink is rendered only in the approved website placements above. The legacy social workflow is guarded by `if: false`, and the provider upload functions fail closed before making external requests. This website advertising placement does not enable social publishing or change historical social queue records.

## Verification

Run:

```bash
pnpm social:publish:check
pnpm check
pnpm lint
pnpm build
```
