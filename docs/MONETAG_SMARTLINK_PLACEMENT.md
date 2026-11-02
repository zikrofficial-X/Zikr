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

For eligible non-kids videos:
- YouTube descriptions include an explicit external-advertising disclosure and the exact SmartLink.
- YouTube tags include descriptive keywords such as `smartlink`, `external offers`, and `روابط إعلانية`. The URL itself belongs in the description, not the tags field.
- Facebook video and Reels captions include the same disclosure and URL. Facebook's video publisher accepts a description/caption rather than a YouTube-style tags array.

For videos whose source audience is `kids`, the SmartLink and its advertising tags are omitted. If the audience cannot be verified for a Facebook video, the link is omitted rather than guessed.

## Publishing behavior

The integration changes metadata at publish time. It does not edit posts that were already published, and it does not republish old videos.

The checked-in GitHub social workflow currently sets `SOCIAL_PUBLISH_ENABLED=true` and runs on its 15-minute schedule. Each run still depends on its protected provider preflight and a ready queue item. This change does not modify those flags, credentials, schedules, queue states, or approvals. Newly published eligible videos receive the disclosure and link automatically.

## Verification

Run:

```bash
pnpm social:publish:check
pnpm check
pnpm lint
pnpm build
```
