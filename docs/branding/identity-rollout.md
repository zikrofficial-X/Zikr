# ZIKR brand identity rollout

## Approved direction
Use the supplied gold crescent / Islamic geometric emblem artwork on midnight navy.
Palette: midnight navy #061322, warm gold #F5C45C, soft ivory #FFF4D8.

## Installed assets on this branch
- PWA icons: `/icons/icon-192.png`, `/icons/icon-512.png`, and `/icons/icon-512-maskable.png`.
- Apple touch icon: `/apple-touch-icon.png`.
- Favicon and primary brand/social artwork are installed under `public/`.
- Android launcher foreground and all density-specific regular/round mipmap icons are installed.
- iOS AppIcon artwork is installed at 1024x1024.
- Brand guidelines are recorded in `public/branding/zikr-brand-guidelines.md`.

## Verification gate
Do not merge until the repository checks pass:
- `pnpm images:check`
- `pnpm mobile:check`
- `pnpm check`
- `pnpm lint`
- `pnpm build`

The GitHub Actions quality gate is running for the latest asset commit. A passing PR quality gate must be confirmed before merge.

## Rollout
After checks pass, merge to `main` and verify the Vercel production deployment.
Android/iOS binaries must be rebuilt and released separately; a web deployment does not
update already-installed native app icons.

No Supabase migrations or production data are part of this branding rollout.
