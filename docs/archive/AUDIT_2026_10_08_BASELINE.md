# Historical baseline — 2026-10-08

> This document records the pre-cleanup automation state. It is not the active architecture source of truth. Use `docs/AUTOMATION_OWNERSHIP_2026-10-08.md` for current ownership and `docs/production-scheduling.md` for active schedules.

# ZIKR Repository Audit Baseline — 2026-10-08

## Current State Summary

**Repository:** zikrcontact-del/Zikr  
**Branch:** main  
**Audit Date:** 2026-10-08 (reconciled 2026-10-08)  
**Purpose:** Comprehensive audit and cleanup for production readiness

## Dependency Versions

### Critical Dependencies
```json
{
  "next": "^16.4.0",
  "react": "^19.2.7",
  "typescript": "^6.0.3",
  "tailwindcss": "^4.3.3",
  "tailwind-merge": "^3.3.1",
  "@supabase/supabase-js": "^2.112.3",
  "@capacitor/core": "7.6.9",
  "@capacitor/cli": "7.4.3",
  "node": "22.x",
  "pnpm": "9.15.0"
}
```

### Known Issues to Fix
1. **Tailwind Merge Compatibility:** tailwind-merge ^3.3.1 resolves to 3.6.0 at runtime (✓ compatible)
2. **Capacitor CLI Version:** 7.4.3 (runtime 7.6.9) - ✓ compatible
3. **Supabase:** ^2.112.3 is current
4. **TypeScript:** 6.0.3 with strict mode enabled ✓

## Project Structure Verified

### Root Directories
```
src/              - 573 files (source code)
scripts/          - 65 scripts/verification utilities
supabase/         - Migrations + functions
public/           - Static + PWA assets
mobile/           - Mobile config + assets
android/          - Capacitor Android
ios/              - Capacitor iOS
.github/          - GitHub Actions (to audit)
.circleci/        - CircleCI config (to audit)
```

### src/ Structure Audit
- `src/app/` - 296 files; 125 page routes + 73 API routes ✓
- `src/features/` - 186 domain files across the current domain modules ✓
- `src/lib/` - Infrastructure (may contain misplaced domain) ⚠️
- `src/components/` - Shared UI and layout ✓

## Verification Scripts (65 total)

### Categories

**Architecture & Structure:**
- verify-platform-routes.mjs - Route completeness ✓ (125 page routes + 73 API route files baseline)
- verify-information-architecture.mjs - Navigation consistency ✓
- verify-admin-architecture.mjs - Admin pages ✓
- verify-ci-architecture.mjs - CI/CD setup ✓

**Content Verification:**
- verify-content-integrity.mjs - UTF-8 encoding ✓
- verify-quran-offline.mjs - Quran data integrity ✓
- verify-quran-canonicalization.mjs - Quran schema ✓
- verify-content-canonicalization.mjs - Content schema ✓

**Mobile & Build:**
- verify-mobile-readiness.mjs - Capacitor config ✓
- verify-project-integrity.mjs - Security + structure ✓
- verify-offline-content.mjs - PWA validation ✓

**Features & Automation:**
- verify-admin-pages.mjs - Admin panel routes ✓
- verify-admin-video-factory.mjs - Video factory UI ✓
- verify-video-factory.mjs - Video generation pipeline ✓
- verify-voice-factory.mjs - Voice generation ✓
- verify-video-qa.mjs - Video quality assurance ✓
- verify-scheduler.mjs - Cron/scheduled jobs ⚠️ (needs verification)
- verify-social-publishing.mjs - Social media queue ✓
- verify-native-social-sync.mjs - Social media config ✓

**Kids Content:**
- verify-kids-production.mjs - Kids setup ✓
- verify-kids-memory.ts - Memory game ✓
- verify-kids-wudu.ts - Wudu game ✓
- verify-kids-verse.ts - Verse game ✓
- verify-kids-quiz.ts - Quiz game ✓
- verify-kids-mosque-adventure.ts - Mosque adventure ✓
- verify-kids-zikr-road.ts - Zikr road game ✓
- verify-kids-zikr-jump.ts - Zikr jump game ✓
- verify-kids-hilal-fly.ts - Hilal fly game ✓
- verify-kids-games-final.ts - All games combined ✓

**Security & Config:**
- verify-security-hardening.mjs - Security checks ✓
- verify-auth-config.mjs - OAuth setup ✓
- verify-canonical-config.mjs - Supabase auth ✓
- verify-local-imports.mjs - Import boundaries ✓
- verify-hygiene.mjs - Stale files ✓

**External Integration:**
- verify-adsense-readiness.mjs - Google AdSense ✓
- verify-google-search-console.mjs - Search Console ✓

**Utility & Release:**
- video-engine-check.mjs - Video engine status
- validate-migrations.mjs - Database migrations ✓
- verify-release-metadata.mjs - Version info ✓
- verify-release-contract.mjs - Release contract ✓
- validate-deployment-env.mjs - Deployment check ✓
- verify-local-quran.mjs - Quran data ✓
- verify-placeholder-media.mjs - No test data in prod ✓
- import-youtube-takeout-native-facebook.mjs - Social import tool
- prepare-mobile-assets.mjs - Mobile build prep ✓
- ensure-ffmpeg.mjs - FFmpeg availability ✓
- run-background-jobs.ts - Background job runner

## Environment Variables (.env.example)

### Configured Sections
1. ✓ Core site URL
2. ✓ Supabase endpoints + keys
3. ✓ Authentication (OAuth callbacks)
4. ✓ YouTube publishing
5. ✓ Facebook/Meta publishing
6. ✓ Video automation (FFmpeg, template-based)
7. ✓ AI (Gemini API)
8. ✓ Media (Cloudinary)
9. ✓ Islamic content API
10. ✓ Analytics / Search / Ads
11. ✓ Kids content settings
12. ✓ Webhooks

### Status
- All critical env vars documented ✓
- Production URLs hardcoded (Supabase, Vercel) ✓
- Secrets marked as empty placeholders ✓
- No committed secrets detected ✓

## Configuration Files Verified

### TypeScript
- `tsconfig.json` ✓
  - strict mode: true ✓
  - noEmit: true ✓
  - baseUrl + path aliases (@/*) ✓
  - allowJs: false (enforces TS) ✓

### Next.js
- `next.config.ts` ✓
  - Security headers (CSP, HSTS, etc.) ✓
  - Image optimization configured ✓
  - Redirects for old routes ✓
  - Rewrites for dynamic content ✓

### Package Manager
- `package.json` ✓
- `pnpm-lock.yaml` ✓
  - lockfileVersion: 9.0 ✓
  - Frozen lockfile enforced in CI ✓

## Package Scripts (pnpm commands)

### Development
- `pnpm dev` - Next.js dev server ✓
- `pnpm build` - Next.js production build ✓
- `pnpm start` - Start production server ✓

### TypeScript & Lint
- `pnpm check` - Type check (tsc --noEmit) ✓
- `pnpm lint` - ESLint ✓
- `pnpm format` - Prettier ✓

### Verification Hierarchy
```
pnpm verify          (all checks)
├── pnpm ci:architecture:check
├── pnpm release:contract:check
├── pnpm release:metadata
├── pnpm quran:offline:check
├── pnpm supabase:migrations:check
├── pnpm schema:contract:check
├── ... (many more)
└── pnpm build

pnpm verify:pr       (PR verification subset)
├── pnpm ci:architecture:check
├── pnpm release:contract:check
└── ... (critical checks only)
```

## Database (Supabase)

### Migrations
- **Canon:** `supabase/migrations/` only (✓ enforced)
- **Archive:** `supabase/migrations_archive/` (historical only)
- **Count:** 332 active migration files after the 2026-10-08 repair migrations
- **Policy:** Additive + idempotent replay ✓
- **Remote Ledger:** REMOTE_MIGRATION_LEDGER.md documents production state ✓

### Functions
- **Location:** `supabase/functions/` (9 files)
- **Status:** Edge Functions for server-side logic ✓

### RLS Policy
- **Status:** All public tables RLS-protected ✓; accidental duplicate public-read policies on hadiths/scholars/stories consolidated
- **Enforcement:** Server-side boundaries enforced ✓

## CI/CD Architecture

### GitHub Actions
- **Location:** `.github/workflows/`
- **Role:** PR/main source verification, controlled release, manual video dispatch.
- **Recurring production schedules:** none.

### CircleCI
- **Location:** `.circleci/config.yml`
- **Role:** recurring video/social processing, English content sync, Android release, explicit recovery.
- **Recurring production schedules:** video/social and English sync.

### Supabase pg_cron
- Prayer notifications remain minute-level scheduler-owned.

### Vercel
- Deployment target only; Git auto-deploy remains disabled by project policy.

## Mobile (Capacitor)

### Configuration
- Android project: `android/` ✓
- iOS project: `ios/` ✓
- Mobile config: `mobile/capacitor.config.ts` ✓
- App ID: `com.zikr.app` ✓
- Version: 1.1.3 / code 57 ✓

### Capabilities
- Splash screen ✓
- Status bar ✓
- Keyboard ✓
- Local notifications ✓
- Push notifications ✓
- Camera + filesystem ✓
- Share + network ✓

## Documentation Status

### Current
- `README.md` - Project overview ✓
- `docs/ARCHITECTURE.md` - Canonical architecture ✓
- `docs/production-scheduling.md` - Scheduler setup ✓
- `docs/api/README.md` - API reference ✓

### Archive (Informational Only)
- `docs/archive/PROJECT_AUDIT_REPORT.md` - Previous audit
- `docs/archive/KIDS_GAMES_IMPLEMENTATION_v1.1.0.md` - Historical
- `docs/finalization/PHASE_2_ARCHITECTURE_MAP_2026-10-02.md` - Phase 2 notes

## Finalization Status

### Completed repairs
- [x] Database admin rate-limit table/function restored and privilege-checked.
- [x] Duplicate public-read RLS policies consolidated for hadiths, scholars and stories.
- [x] Migration filenames reconciled exactly with applied Supabase versions/names.
- [x] Broken unused enhanced video worker removed.
- [x] `/admin/video-factory/queue` made canonical; `/admin/videos` retained as a compatibility redirect.
- [x] Duplicate Vercel `*_2` environment variables removed from Production/Preview scope (Development-only retained because the connector does not expose deletion).
- [x] Current route verification baselines reconciled to 125 page routes and 73 API route files.
- [x] Current package/mobile release metadata reconciled to ZIKR 1.1.3 / Android versionCode 57.

### Final gates still required
- [ ] Repair branch CI/quality checks must report success.
- [ ] Preview deployment must become READY and pass public smoke tests.
- [ ] PR #281 must be merged only after verification.
- [ ] Production release must use the exact merged main SHA and be independently smoke-tested.

---

**Generated:** 2026-10-08