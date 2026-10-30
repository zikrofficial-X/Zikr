# ZIKR approved brand binary assets

This archive contains only the 20 binary artwork and launcher-icon files. It deliberately
excludes source-code files so it cannot overwrite newer application code.

## Apply from Termux

1. Download this archive to your phone.
2. Open Termux and go to your existing Zikr repository.
3. Run:

```bash
git fetch origin
git switch branding/zikr-identity
unzip -o ~/storage/downloads/ZIKR_brand_binary_assets_only.zip -d .
git status --short
git add public/branding public/favicon.ico public/apple-touch-icon.png public/icons android/app/src/main/res/drawable/ic_launcher_foreground.png android/app/src/main/res/mipmap-* ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
git commit -m "feat(branding): install approved ZIKR web and native icons"
git push origin branding/zikr-identity
```

If the archive is stored in another folder, change only the path passed to `unzip`.

## After push

Open PR #149:
https://github.com/zikrofficial-X/Zikr/pull/149

Run the image/mobile/type/lint/build checks. Merge only after they pass.
The native Android and iOS packages must then be rebuilt and reinstalled.

The archive does not contain source-code changes, database migrations, or deployment
commands.
