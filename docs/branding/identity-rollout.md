# ZIKR brand identity rollout

## Approved direction
Use the supplied gold crescent / Islamic geometric emblem artwork on midnight navy.
Palette: midnight navy #061322, warm gold #F5C45C, soft ivory #FFF4D8.

## Changes in this branch
- PWA manifest uses midnight navy as background/theme color.
- Manifest declares a dedicated maskable icon at /icons/icon-512-maskable.png.
- Apple touch icon points to /icons/icon-192.png.
- Brand guidelines are recorded in public/branding/zikr-brand-guidelines.md.

## Important remaining work
The repository's current binary icon assets (PWA PNGs, Android mipmap/foreground,
iOS AppIcon and favicon) have not yet been replaced with the approved artwork.
The referenced maskable PNG is not present on the base branch. Add verified, correctly
sized binary assets before merging this branch. Do not merge until:
- icon-192.png is 192x192 PNG;
- icon-512.png is 512x512 PNG;
- icon-512-maskable.png is 512x512 PNG with foreground content inside the maskable safe zone;
- Android launcher resources are regenerated at all densities;
- iOS AppIcon asset is a 1024x1024 PNG and Contents.json remains consistent;
- favicon and Apple touch icon are verified;
- pnpm images:check, pnpm mobile:check, pnpm check, pnpm lint, and pnpm build pass.

## Rollout
Merge only after asset files and CI checks are complete. Vercel should deploy from main.
Android/iOS binaries must be rebuilt and released separately; a web deployment does not
update already-installed native app icons.
