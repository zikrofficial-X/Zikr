# Troubleshooting

## Offline library says it is incomplete

Open `/offline-library` while online and run **«تحديث وتجهيز المكتبة كاملة»** again. The page now reports failures by dataset and by route; use those names to identify the failing file or page. A partial result is intentionally not recorded as a full-pack success.

## Dataset count mismatch

Run:

```bash
pnpm offline:check
```

The verifier reads every dataset JSON file and compares its actual row count with `public/offline-content/v1/manifest.json`. Refresh the affected static file from the published Supabase records, update the manifest count and rerun the check. Do not fix a mismatch by changing only the count.

## A page is missing while offline

Check that the page exists in `public/offline-content/v2/routes.json` or the sitemap, is a same-origin public page, and does not redirect to a private route. Private pages such as account, admin, profile, favorites and settings are intentionally excluded.

## Clearing the local offline library

Use **«إفراغ المكتبة المحلية»** from `/offline-library`. It clears downloaded public datasets and route caches while preserving IndexedDB favorites and local preferences. The UI reports a clear failure if the service worker does not acknowledge the request.

## Media does not play offline

External radio, recitation and video streams require internet unless a specific media file is explicitly bundled with the app. The text-content offline package does not download large external streams.

## Validation commands

```bash
pnpm offline:check
pnpm mobile:check
pnpm project:check
pnpm verify
```

A browser-based verification does not replace the Android Airplane Mode acceptance test described in `docs/OFFLINE_SUPPORT.md`.
