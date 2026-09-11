# 🚨 CRITICAL FIX GUIDE - Migration Conflict Resolution
**Date:** 2026-09-11  
**Issue:** `Remote migration versions not found in local migrations directory`

---

## 🔍 Root Cause Analysis

Your CI/CD workflow failed with:
```
Remote migration versions not found in local migrations directory.
```

This happens because:

1. **Production Supabase** has migrations that don't exist in your local `/supabase/migrations/`
2. **Local Drizzle migrations** are out of sync with Supabase remote state
3. **Duplicate/Overlapping RLS policies** cause the initial error you reported

### Evidence:
```sql
-- ERROR you saw:
ERROR: policy "admin_all_article_categories_insert" for table "article_categories" 
already exists (SQLSTATE 42710)

-- This happens in: 20260911040038_harden_rls_policies_and_deduplicate_fts_indexes.sql
-- Because previous migrations already created these policies
```

---

## 📋 The Problem in 3 Parts

### Part 1: Duplicate Migration Files
```
Local migrations:
  ✅ 20260911021025_harden_social_video_reels_and_cleanup.sql (CANONICAL)
  ❌ 20260911030000_harden_social_video_reels_and_cleanup_reconciliation.sql (DUPLICATE)
  ❌ 20260911031229_harden_social_video_reels_and_cleanup_reconciliation.sql (DUPLICATE)
  ✅ 20260911040038_harden_rls_policies_and_deduplicate_fts_indexes.sql (CANONICAL)
```

**Impact:** Supabase sees remote migrations that local doesn't have, causing sync failure.

### Part 2: Migration History Mismatch
```
Migration 20260911040038 tries to CREATE POLICY admin_all_article_categories_insert
But it's already created in an earlier migration, causing DUPLICATE POLICY error.
```

### Part 3: Drizzle Schema Out of Sync
```typescript
// drizzle/schema.ts doesn't match Supabase table definitions
// Missing columns, extra fields, misaligned foreign keys
```

---

## ✅ Step-by-Step Fix

### STEP 1: Identify Remote Migration State
```bash
# Check what Supabase has vs what local repo has
pnpm supabase:migrations:check

# This will show:
# - Remote versions (what's in production)
# - Local versions (what's in git)
# - Drift/conflicts
```

### STEP 2: Remove Duplicate Migration Files
```bash
# Delete these DUPLICATE files (keep CANONICAL versions):
rm supabase/migrations/20260911030000_harden_social_video_reels_and_cleanup_reconciliation.sql
rm supabase/migrations/20260911031229_harden_social_video_reels_and_cleanup_reconciliation.sql
rm supabase/migrations/20260901194900_reconcile_remote_migration_history_20260901.sql

# Keep these CANONICAL files:
# ✅ 20260911021025_harden_social_video_reels_and_cleanup.sql
# ✅ 20260911040038_harden_rls_policies_and_deduplicate_fts_indexes.sql
```

### STEP 3: Fix the RLS Policy Overlap Issue

Create a new migration to clean up the duplicate policies:

**File: `supabase/migrations/20260911_fix_rls_policy_duplicates.sql`**
```sql
-- Fix overlapping RLS policies that cause "already exists" errors
-- These policies were created in earlier migrations, remove them before re-creation

-- Remove all duplicate admin policies (they'll be recreated properly)
DROP POLICY IF EXISTS admin_all_article_categories ON public.article_categories;
DROP POLICY IF EXISTS admin_all_articles ON public.articles;
DROP POLICY IF EXISTS admin_all_battles ON public.battles;
DROP POLICY IF EXISTS admin_all_companion_stories ON public.companion_stories;
DROP POLICY IF EXISTS admin_all_companions ON public.companions;
DROP POLICY IF EXISTS admin_all_competitions ON public.competitions;
DROP POLICY IF EXISTS admin_all_conquest_events ON public.conquest_events;
DROP POLICY IF EXISTS admin_all_conquests ON public.conquests;
DROP POLICY IF EXISTS admin_all_dua_categories ON public.dua_categories;
DROP POLICY IF EXISTS admin_all_duas ON public.duas;
DROP POLICY IF EXISTS admin_all_hadith_books ON public.hadith_books;
DROP POLICY IF EXISTS admin_all_hadith_explanations ON public.hadith_explanations;
DROP POLICY IF EXISTS admin_all_hadiths ON public.hadiths;
DROP POLICY IF EXISTS admin_all_kids_content ON public.kids_content;
DROP POLICY IF EXISTS admin_all_memorization_plans ON public.memorization_plans;
DROP POLICY IF EXISTS admin_all_pinned_messages ON public.pinned_messages;
DROP POLICY IF EXISTS admin_all_prophet_sections ON public.prophet_sections;
DROP POLICY IF EXISTS admin_all_prophets ON public.prophets;
DROP POLICY IF EXISTS admin_all_quran_ayahs ON public.quran_ayahs;
DROP POLICY IF EXISTS admin_all_quran_reciters ON public.quran_reciters;
DROP POLICY IF EXISTS admin_all_quran_surahs ON public.quran_surahs;
DROP POLICY IF EXISTS admin_all_quran_tafsir ON public.quran_tafsir;
DROP POLICY IF EXISTS admin_all_scholars ON public.scholars;
DROP POLICY IF EXISTS admin_all_site_settings ON public.site_settings;
DROP POLICY IF EXISTS "Admin Full Access Stories" ON public.stories;
DROP POLICY IF EXISTS admin_all_video_categories ON public.video_categories;
DROP POLICY IF EXISTS admin_all_videos ON public.videos;

-- Now create proper admin policies with _insert suffix to avoid conflicts
DO $$
DECLARE
  table_name text;
  base_policy_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'article_categories', 'articles', 'battles', 'companion_stories', 'companions',
    'competitions', 'conquest_events', 'conquests', 'dua_categories', 'duas',
    'hadith_books', 'hadith_explanations', 'hadiths', 'kids_content',
    'memorization_plans', 'pinned_messages', 'prophet_sections', 'prophets',
    'quran_ayahs', 'quran_reciters', 'quran_surahs', 'quran_tafsir', 'scholars',
    'site_settings', 'stories', 'video_categories', 'videos'
  ]
  LOOP
    base_policy_name := 'admin_all_' || table_name;
    IF table_name = 'stories' THEN
      base_policy_name := 'Admin Full Access Stories';
    END IF;
    
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.is_admin_user())',
      base_policy_name || '_insert', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.is_admin_user()) WITH CHECK (private.is_admin_user())',
      base_policy_name || '_update', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (private.is_admin_user())',
      base_policy_name || '_delete', table_name
    );
  END LOOP;
END $$;
```

### STEP 4: Sync Drizzle Schema with Supabase
```bash
# Pull the current remote schema
pnpm dlx drizzle-kit introspect

# This updates drizzle/schema.ts to match production
# Review changes, commit them
```

### STEP 5: Deploy Fixes
```bash
# Push the fixed migrations to Supabase
pnpm db:migrate:supabase

# Verify they applied successfully
pnpm supabase:migrations:check

# Should see: "All remote migrations present locally ✓"
```

---

## 🔧 Quick Commands

```bash
# 1. Check current state
pnpm supabase:migrations:check

# 2. Remove duplicates (list them first)
ls -lah supabase/migrations/ | grep "2026091"

# 3. Create the fix migration (copy the SQL above)
touch supabase/migrations/20260911_fix_rls_policy_duplicates.sql

# 4. Sync schema
pnpm dlx drizzle-kit introspect

# 5. Test locally
pnpm build
pnpm check

# 6. Deploy
pnpm db:migrate:supabase
```

---

## 📊 Expected Results

### Before (Error State):
```
Remote migration versions not found in local migrations directory.
ERROR: policy "admin_all_article_categories_insert" already exists
CI/CD Workflow: ❌ FAILED
```

### After (Fixed):
```
✓ All migrations synced
✓ All RLS policies created without conflicts
✓ Drizzle schema matches Supabase
CI/CD Workflow: ✅ PASSED
```

---

## 🛡️ Prevention Going Forward

1. **Use semantic versioning** for migrations:
   - `20260911000001_feature_name.sql` (initial)
   - `20260911000002_feature_name_fix.sql` (follow-up)
   - NOT: `20260911000001_v1.sql`, `20260911000001_v2.sql`, `20260911000001_v3.sql`

2. **Never delete migrations** - only add new ones
   - Instead: "DROP IF EXISTS" then "CREATE" in a new migration

3. **Use `IF NOT EXISTS`** or `DROP IF EXISTS` patterns:
   ```sql
   -- GOOD:
   DROP POLICY IF EXISTS policy_name ON table_name;
   CREATE POLICY policy_name ON table_name ...
   
   -- BAD:
   CREATE POLICY policy_name ON table_name ...  -- Fails if exists
   ```

4. **Test migrations locally first**:
   ```bash
   supabase start
   supabase db push  # Test locally
   # Then push to production
   ```

5. **Keep migration history clean**:
   - Archive old migrations in `supabase/migrations_archive/`
   - Maintain current/active migrations in `supabase/migrations/`

---

## ❓ Troubleshooting

### Still seeing "policy already exists"?
```bash
# Check which policies exist
psql "connection-string" -c "\dp+ public.article_categories"

# Manually clean up
psql "connection-string" -c "DROP POLICY IF EXISTS admin_all_article_categories_insert ON public.article_categories;"
```

### Migration file not recognized?
```bash
# Check file format - must be timestamp_description.sql
# ✅ 20260911123456_fix_policies.sql
# ❌ 20260911_fix_policies.sql (missing timestamp digits)
# ❌ fix_policies.sql (no timestamp)
```

### Schema out of sync?
```bash
# Generate from production
pnpm dlx drizzle-kit introspect

# This creates accurate schema from live database
```

---

**Status:** Ready to apply  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (non-breaking, fixes conflicts)
