# ZIKR Release Checklist — v1.1.7

## Canonical production URL
- `PRODUCTION_URL`: `https://zikrmediaofficial.vercel.app`
- `NEXT_PUBLIC_SITE_URL`: `https://zikrmediaofficial.vercel.app`
- Supabase Auth `site_url`: `https://zikrmediaofficial.vercel.app`
- App OAuth callback: `https://zikrmediaofficial.vercel.app/auth/callback`

## URL policy
- No alternate production website domain is configured in the application source.
- `localhost` entries are development-only redirects.
- `*.supabase.co/auth/v1/callback` is the Supabase provider callback and is not an application website URL.
- Vercel preview URLs are deployment infrastructure and are not the canonical production site.

## Release baseline
- Base branch: `main`
- Previous published release: `v1.1.6`
- Target release: `v1.1.7`
- Release commit should be the current `main` commit.
