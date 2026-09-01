# ZIKR v1.2.7

## Release verification

- Align package.json Capacitor keyboard spec with pnpm-lock.yaml.
- Android versionName: 1.2.7
- Android versionCode: 23
- Includes the current Supabase migration reconciliation state already present on main.
- Native YouTube → Facebook foundation remains gated on real media and valid Facebook credentials.

## Verification targets

- pnpm install --frozen-lockfile
- pnpm verify
- Android signed APK/AAB build
- APK signature and applicationId verification
- SHA256 checksums
