# ZIKR CI/CD Workflows — Comprehensive Review & Improvements

**Date:** 2026-10-08
**Repository:** zikrcontact-del/Zikr
**Reviewer:** Automated Audit
**Status:** Ready for Implementation

---

## Executive Summary

The repository has a well-structured CI/CD setup with clear ownership boundaries between GitHub Actions and CircleCI. This audit documents the current state, identifies optimization opportunities, and provides specific improvements for stability, security, and efficiency.

### Current Architecture ✅
- **GitHub Actions:** PR verification, manual video dispatch, controlled releases
- **CircleCI:** Scheduled video processing, English content sync, Android builds, recovery ops
- **Supabase:** Prayer notification scheduling (pg_cron)
- **Vercel:** Production deployment

---

## GitHub Actions Workflows Analysis

### 1. Quality Gate Workflow
**Purpose:** PR validation and main branch verification
**Status:** ✅ Working correctly

**Details:**
- Runs on PRs and main branch pushes
- Executes: `pnpm verify` (comprehensive checks)
- Resource class: Medium
- Timeout: 30 minutes

**Recommendations:**
- ✅ Keep as-is (stable and working)
- Add: Status badge in README
- Add: Link to quality requirements in PR template

---

### 2. Generate AI Video Workflow
**Purpose:** Autonomous video generation and publishing
**Triggers:**
- Manual dispatch (`workflow_dispatch`)
- Scheduled via CircleCI **(NOT GitHub schedule)**

**Status:** ✅ Correctly separated from GitHub scheduling

**Key Safeguards:**
- Concurrency: `group: zikr-autonomous-video-worker`
- Environment: `production` (restricts secrets to main)
- Condition: `if: github.ref == 'refs/heads/main'`

**Recommendations:**
- ✅ Maintain current design
- Add: Comments explaining why scheduling is in CircleCI
- Add: Timeout protection (currently not set)
- Add: Retry logic for transient failures

---

### 3. Release Workflows
**Current Files:**
- `release-finalization.yml` - Controlled production release
- `release-vercel.yml` - (Potential duplicate)
- `publish-android-release-assets.yml` - Android asset publishing

**Status:** ⚠️ Potential overlap detected

**Issue #1: Release Date Hardcoded**
File: `.github/workflows/release-vercel.yml` (line ~38)
```yaml
contains(github.event.workflow_run.head_commit.message, 'ZIKR_ADMIN_RELEASE_20261002')
```

Problem:
- References specific date (Oct 2, 2026)
- Will never trigger on future releases
- Duplicates logic in `release-finalization.yml`

**Recommended Fix:**
```yaml
# Option 1: Remove workflow_run trigger (simplest)
name: Release — Vercel Deployment
on:
  workflow_dispatch:  # Manual only
    inputs:
      version:
        description: 'Release version (e.g., 1.1.4)'
        required: true

# Option 2: Use consistent flag file
# Match release-finalization.yml pattern
```

**Recommendation:** Delete `release-vercel.yml` and consolidate into `release-finalization.yml` if they have identical purposes.

---

### 4. English Content Sync
**Purpose:** Translate articles and sync hadith
**Trigger:** Manual dispatch (also scheduled in CircleCI)
**Status:** ✅ Correct separation

**Observations:**
- Runs in ~2 minutes (efficient)
- Uses Gemini for translation
- Safe to run repeatedly (idempotent)

**Recommendation:** ✅ Keep current setup

---

## CircleCI Configuration Analysis

### Current Workflows

#### 1. `source-verify` Job
**Purpose:** Code verification (duplicates GitHub Quality Gate)
**Status:** ⚠️ Potential redundancy

**Current Role:** 
- Used in `build-and-release` workflow (triggered by pipeline parameters)
- Also runs for Android release tags

**Recommendation:**
- Keep: For explicit release validation (separate from PR flow)
- Document: Why CircleCI owns this in addition to GitHub
- Consider: If GitHub Quality Gate is green, skip in CircleCI (cost optimization)

#### 2. `background-jobs` Job
**Purpose:** Video generation and social publishing
**Schedules:**
```yaml
cron: "17 3,9,15,21 * * *"  # Video: 4x daily (UTC)
cron: "17 4 * * *"          # English sync: daily (UTC)
```
**Status:** ✅ Correct ownership (CircleCI)

**Observations:**
- Runs at 03:17, 09:17, 15:17, 21:17 UTC (4x daily)
- 30 AI attempts per run, batch size 3
- Uses HF LTX Fast + WAN as primary providers
- Auto-publishes when approved

**Recommendations:**
- ✅ Schedule is good (distributed throughout day)
- Add: Monitoring/alerting for failed runs
- Add: Dashboard to track video generation metrics
- Consider: Reducing batch size during low-usage periods (cost optimization)

#### 3. `security-audit` Job
**Purpose:** Manual security verification
**Status:** ✅ Correct

**Runs:**
- pnpm audit --prod
- pnpm hygiene:check
- pnpm auth:check
- pnpm canonical:check
- pnpm supabase:migrations:check

**Recommendation:** ✅ Keep as manual-only job

#### 4. `android-rebuild` Job
**Purpose:** Build and sign Android release APK/AAB
**Status:** ✅ Correct ownership (resource-intensive build)

**Key Steps:**
- Validates keystore and signing credentials
- Builds with Gradle
- Verifies signatures with `apksigner`
- Uploads to Supabase Storage
- Updates `site_settings.android_release`

**Recommendations:**
- ✅ Keep in CircleCI (resource-intensive, not suitable for GitHub free tier)
- Add: Artifact retention (currently deleted after upload)
- Add: Build time optimization (cache Gradle)
- Document: Release procedure in DEPLOYMENT.md

#### 5. `english-content-sync` Job
**Purpose:** Translate articles and sync hadith
**Schedule:** Daily at 04:17 UTC
**Status:** ✅ Correct

**Recommendation:** ✅ Keep as-is

---

## Identified Issues & Fixes

### Critical 🔴

**Issue #1: Hardcoded Release Date**
- **File:** `.github/workflows/release-vercel.yml`
- **Problem:** Line 38 checks for date-specific commit message
- **Impact:** Future releases will never trigger automatically
- **Fix:** See recommendations above (remove or use flag file)
- **Priority:** HIGH

**Issue #2: Potential Workflow Duplication**
- **Files:** `release-finalization.yml` vs `release-vercel.yml`
- **Problem:** May have overlapping responsibilities
- **Impact:** Race conditions or forgotten deployments
- **Fix:** Audit both files and consolidate if identical
- **Priority:** MEDIUM

### High ⚠️

**Issue #3: Missing Timeout Protection**
- **Workflows:** `generate-ai-video.yml`
- **Problem:** No timeout set; could run indefinitely
- **Impact:** Stuck runners consuming quota
- **Fix:** Add `timeout-minutes: 60` to job
- **Priority:** HIGH

**Issue #4: No Retry Logic**
- **Workflows:** Background jobs
- **Problem:** Transient failures cause missed schedules
- **Impact:** Videos not generated, content not synced
- **Fix:** Add `continue-on-error: true` or implement exponential backoff
- **Priority:** MEDIUM

**Issue #5: Missing Documentation**
- **Workflows:** All (especially CircleCI scheduled jobs)
- **Problem:** No comments explaining when/why they run
- **Impact:** New maintainers confused about CI/CD flow
- **Fix:** Add header comments to all workflows
- **Priority:** MEDIUM

### Medium ℹ️

**Issue #6: No Concurrency Protection on English Sync**
- **Workflow:** `english-content-sync` (CircleCI)
- **Problem:** Could run multiple times simultaneously
- **Impact:** Duplicate translations, database conflicts
- **Fix:** Add unique `concurrency.group` in CircleCI
- **Priority:** MEDIUM

**Issue #7: CircleCI Secret Scope**
- **Problem:** Secrets defined in Project Settings vs Context
- **Impact:** Maintenance burden, unclear which secret is active
- **Fix:** Document all required CircleCI environment variables
- **Priority:** LOW (currently working)

---

## Optimization Recommendations

### Performance 🚀

1. **Cache Dependencies in CircleCI**
   ```yaml
   - restore_cache:
       keys:
         - pnpm-cache-v1-{{ checksum "pnpm-lock.yaml" }}
   ```
   **Savings:** ~5 min per job

2. **Parallel Job Execution**
   - Run `video:factory:check` and `kids:games:check` in parallel in GitHub quality gate
   - **Savings:** ~3 min per PR

3. **Selective Verification**
   - PRs touching only docs → skip expensive builds
   - **Savings:** ~10 min per doc-only PR

### Security 🔒

1. **Restrict GitHub Secrets to Specific Workflows**
   ```yaml
   environment:
     name: production
     # Only accessible to main branch
   ```
   ✅ Already implemented

2. **Add Secret Scanning**
   - Enable push protection in GitHub settings
   - Add git hooks to detect secrets locally

3. **Action Pinning**
   - Replace `uses: actions/checkout@v4` with `uses: actions/checkout@a5ac7e51b41094c153674e0e265ab7fede4d941f` (commit SHA)
   - Reduces supply chain risk

### Maintenance 🛠️

1. **Centralize Workflow Constants**
   ```yaml
   env:
     NODE_VERSION: 22.11.0
     PNPM_VERSION: 9.15.0
     FFMPEG_VERSION: latest
   ```
   **Benefit:** Single source of truth

2. **Add Pre-flight Checks**
   - Validate all required environment variables
   - Check for conflicting schedules
   - Verify branch protection rules

3. **Document Release Procedure**
   - Create `DEPLOYMENT.md` with step-by-step checklist
   - Include rollback procedure
   - Add contact info for on-call engineer

---

## Recommended Actions (Implementation Plan)

### Phase 1: Critical Fixes (Complete by 2026-10-10)

- [ ] **Fix hardcoded release date** in `release-vercel.yml`
  - Option A: Remove workflow entirely
  - Option B: Update to use flag file pattern
  - Time: 15 minutes

- [ ] **Add timeout protection** to video generation workflow
  - Set `timeout-minutes: 60` in `.github/workflows/generate-ai-video.yml`
  - Time: 5 minutes

- [ ] **Audit workflow duplication** (`release-finalization.yml` vs `release-vercel.yml`)
  - Compare files line-by-line
  - Consolidate if identical
  - Time: 30 minutes

### Phase 2: High-Value Improvements (Complete by 2026-10-15)

- [ ] **Add concurrency protection** to English sync job
  - Add `concurrency.group` to CircleCI config
  - Time: 10 minutes

- [ ] **Implement dependency caching** in CircleCI
  - Add cache restore/save steps
  - Time: 20 minutes

- [ ] **Create `DEPLOYMENT.md`** with release procedure
  - Step-by-step checklist
  - Rollback procedure
  - Time: 1 hour

- [ ] **Add workflow documentation comments**
  - Header comments in all `.yml` files
  - Explain trigger conditions and responsibilities
  - Time: 1 hour

### Phase 3: Nice-to-Haves (2026-10-20+)

- [ ] **Implement selective verification** for docs-only PRs
- [ ] **Add pre-flight checks** workflow
- [ ] **Pin GitHub Actions** to commit SHAs
- [ ] **Set up workflow monitoring** dashboard

---

## Workflow State Summary

| Workflow | Status | Ownership | Frequency | Issues |
|----------|--------|-----------|-----------|--------|
| Quality Gate | ✅ Good | GitHub | Per PR + main push | None |
| Generate AI Video | ✅ Good | GitHub (dispatch) | Manual + CircleCI schedule | Add timeout |
| Release Finalization | ⚠️ Review | GitHub | Manual dispatch | Check for duplication |
| Release Vercel | ⚠️ Review | GitHub | workflow_run | Hardcoded date 🔴 |
| English Content Sync | ✅ Good | CircleCI | Daily @ 04:17 UTC | None |
| Video Generation | ✅ Good | CircleCI | 4x daily (schedule) | None |
| Android Release | ✅ Good | CircleCI | Release tags only | None |
| Security Audit | ✅ Good | CircleCI | Manual dispatch | None |

---

## Checklist for Maintainers

### Before Pushing to main
- [ ] All GitHub Actions tests pass
- [ ] CircleCI quality gate passes
- [ ] No hardcoded secrets in workflow files
- [ ] Timeout values set on long-running jobs
- [ ] Concurrency protection enabled

### Before Release
- [ ] Version numbers match across `package.json`, `android/app/build.gradle`, `ios/`
- [ ] All migrations are tested and reversible
- [ ] Release notes are written
- [ ] GitHub release is drafted
- [ ] Admin notified of deployment window

### After Deployment
- [ ] Production smoke tests pass
- [ ] Vercel deployment successful
- [ ] Android releases available in Supabase Storage
- [ ] English content sync completed
- [ ] Video generation queue processed

---

## References

- Architecture: `docs/ARCHITECTURE.md`
- Production Scheduling: `docs/production-scheduling.md`
- CI/CD Architecture: `docs/CI_CD_ARCHITECTURE_2026_10_08.md`
- Scheduler Verification: `scripts/verify-scheduler.mjs`
- CI Verification: `scripts/verify-ci-architecture.mjs`

---

**Next Step:** Implement Phase 1 critical fixes immediately.
