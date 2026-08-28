# ZIKR Asset Management Guide

## Naming rules (enforced)
- Use **lowercase only**.
- Use **kebab-case only** (`example-file-name.png`).
- Use **no spaces**.
- Use **English filenames only** (no Arabic/Unicode in file names).

Examples:
- ✅ `zikr-logo.png`
- ✅ `hero-banner.jpg`
- ❌ `صورة ذكر.png`
- ❌ `ZIKR LOGO FINAL.png`

## Folder structure and purpose
- `public/assets/`: general shared assets or temporary imports before sorting.
- `public/branding/logos/`: primary and variant logos (`zikr-logo.png`, `zikr-gold.png`).
- `public/branding/icons/`: brand iconography and app symbols.
- `public/branding/favicons/`: favicon/SEO files (`favicon.ico`, `apple-touch-icon.png`, `og-image.png`).
- `public/branding/typography/`: font previews and brand type assets.
- `public/banners/homepage/`: homepage hero and section banners.
- `public/banners/ramadan/`: Ramadan seasonal campaign banners.
- `public/banners/videos/`: video collection banners.
- `public/banners/events/`: event-specific banners.
- `public/thumbnails/youtube/`: standard YouTube thumbnails.
- `public/thumbnails/shorts/`: vertical short-form cover images.
- `public/thumbnails/podcasts/`: podcast episode thumbnails.
- `public/thumbnails/documentaries/`: long-form documentary thumbnails.
- `public/social/facebook/`: Facebook covers/post templates.
- `public/social/instagram/`: Instagram post/reel templates.
- `public/social/youtube/`: YouTube channel banners/community assets.
- `public/social/tiktok/`: TikTok thumbnails/cover frames.
- `public/backgrounds/islamic/`: Islamic pattern backgrounds.
- `public/backgrounds/dark/`: dark mode and cinematic backgrounds.
- `public/backgrounds/serenity/`: calming background visuals.
- `public/backgrounds/night/`: night-themed scenes.
- `public/placeholders/videos/`: fallback images for video cards.
- `public/placeholders/scholars/`: fallback scholar portraits.
- `public/placeholders/stories/`: fallback story cards.
- `public/placeholders/poetry/`: fallback poetry visuals.
- `public/quran/`, `public/hadith/`, `public/scholars/`, `public/stories/`, `public/poetry/`: domain content media.
- `public/audio/`, `public/video/`: media files and generated covers.
- `public/ui/`: reusable UI-only image assets and generic fallbacks.

## Recommended formats
- Logos/icons: `svg` (preferred), `png` fallback.
- Banners/backgrounds: `webp` first, `jpg/png` fallback.
- Thumbnails/social: `webp` or `jpg`.
- Transparent artwork: `png`.
- Favicons: `ico` and `png`.

## Recommended sizes
- Logos: 512x512 source, render responsive.
- Homepage hero banner: 1920x1080.
- Social covers:
  - Facebook cover: 1640x624.
  - YouTube banner: 2560x1440.
  - Instagram post: 1080x1080.
  - TikTok cover: 1080x1920.
- Thumbnails:
  - YouTube/documentaries: 1280x720.
  - Shorts: 1080x1920.
  - Podcasts: 1400x1400.
- Placeholders: minimum 1200x675 for landscape; 1080x1080 for square.
- OG image: 1200x630.

## Reserved placeholder reference paths
- `/branding/logos/zikr-logo.png`
- `/branding/logos/zikr-gold.png`
- `/banners/homepage/main-hero.png`
- `/banners/ramadan/ramadan-banner.png`
- `/thumbnails/youtube/default-thumb.png`
- `/social/facebook/facebook-cover.png`
- `/social/youtube/youtube-banner.png`
- `/backgrounds/serenity/serenity-bg.png`
- `/placeholders/videos/video-placeholder.png`
- `/placeholders/scholars/scholar-placeholder.png`

## Upload workflow
1. Optimize assets before upload (prefer WebP, compress losslessly where needed).
2. Validate filename rules.
3. Place files in the exact folder by content type.
4. Verify path use in components and pages.
5. Run `pnpm build` before deployment.

## Next.js image system notes
- Use `next/image` only.
- Always pass size behavior (`width/height` or `fill + sizes`) to avoid CLS.
- Keep paths case-sensitive and absolute from `/public` root.
- Use component fallbacks (`Logo`, `HeroBanner`, `Thumbnail`, `SocialBanner`, `PlaceholderImage`, `BackgroundImage`).
