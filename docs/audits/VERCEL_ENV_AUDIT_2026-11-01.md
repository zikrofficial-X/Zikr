# Vercel Environment Audit — 2026-11-01

## Verified canonical values

| Variable | Verified value | Result |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ymxdswkaxafakugktsim.supabase.co` | Correct |
| `NEXT_PUBLIC_SITE_URL` | `https://zikrmediaofficial.vercel.app` | Correct |
| `AUTH_CALLBACK_URL` | `https://zikrmediaofficial.vercel.app/auth/callback` | Correct |

Secret values were not retrieved or printed.

## Vercel variables requiring removal

| Variable(s) | Reason | Scope |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Android signing secrets are owned by CircleCI's protected `android-signing` context; they are not needed by the web runtime. | Development, Preview, Production |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Obsolete app variables; validator rejects them. Google login is configured in Supabase Auth. | Development, Preview, Production |
| `VIDEO_AUTO_PUBLISH` | Explicitly classified as stale by `scripts/verify-hygiene.mjs`; no active runtime reader found. | Development, Preview, Production |
| `SOCIAL_SYNC_SECRET` | Only legacy migration/backfill documentation references remain; not part of the current GitHub social publisher contract. | Development, Preview, Production |
| `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_HOST`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Direct Postgres values are not used by the Next.js application. The release workflows use GitHub secrets separately. | Development, Preview, Production |

## Keep

- `ANDROID_APP_LINKS_SHA256` is read by `src/app/.well-known/assetlinks.json/route.ts`.
- `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` is required by `src/features/auth/components/google-oauth-button.tsx` for native Android Google sign-in; production and Preview values are present in Vercel and must be kept.
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, and `FACEBOOK_PAGE_ID` are used by the Facebook OAuth connect/callback.
- `FACEBOOK_PAGE_ACCESS_TOKEN` is a legacy fallback in `src/features/social/services/facebook-credentials.ts`; retire only after the fallback code path is removed.
- `GITHUB_DISPATCH_TOKEN` and `GH_TOKEN` support the admin release manager and Android release listing.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are used by current application/workers.

## Integration-managed variables requiring separate review

`SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWT_SECRET`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are present. Some are integration-managed aliases; do not remove them until the Vercel/Supabase integration ownership is checked. The app currently uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as a fallback for offline-content export.

## Execution limitation

The connected Vercel action set supports listing, reading, creating, and editing project environment variables, but does not expose deletion. These confirmed obsolete variables were not modified. Remove them in Vercel Project Settings → Environment Variables, taking care not to remove the distinct CircleCI context or GitHub secrets. No secret values are included in this audit.

## Validation

- Canonical runtime values were read back from Vercel and matched the production contract.
- All cleanup candidates were cross-checked against repository source searches.
- No Vercel environment variable was edited or deleted in this pass.
