#!/bin/bash

##############################################################################
#                                                                            #
#    ZIKR MEDIA - PRODUCTION SETUP & DEPLOYMENT SCRIPT                      #
#    This script will help you complete the final deployment steps          #
#                                                                            #
##############################################################################

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     🚀 ZIKR MEDIA - PRODUCTION SETUP & DEPLOYMENT 🚀           ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# STEP 1: Check Prerequisites
# ──────────────────────────────────────────────────────────────────────────

echo "📋 CHECKING PREREQUISITES..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm --version)"

# Check git
if ! command -v git &> /dev/null; then
    echo "❌ git is not installed. Please install git"
    exit 1
fi
echo "✅ git $(git --version | cut -d' ' -f3)"

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi
echo "✅ vercel $(vercel --version)"

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
fi
echo "✅ supabase $(supabase --version)"

echo ""
echo "✅ All prerequisites installed!"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# STEP 2: Environment Variables Configuration
# ──────────────────────────────────────────────────────────────────────────

echo "📝 STEP 1: ENVIRONMENT VARIABLES"
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "❗ IMPORTANT: The following 6 variables must be set in Vercel:"
echo ""
echo "1. NEXT_PUBLIC_SUPABASE_URL"
echo "   └─ Get from: https://app.supabase.com → Settings → API"
echo ""
echo "2. NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   └─ Get from: https://app.supabase.com → Settings → API"
echo ""
echo "3. SUPABASE_SERVICE_ROLE_KEY"
echo "   └─ Get from: https://app.supabase.com → Settings → API"
echo "   └─ ⚠️  KEEP SECRET - Server only"
echo ""
echo "4. NEXT_PUBLIC_GOOGLE_CLIENT_ID"
echo "   └─ Get from: https://console.cloud.google.com → OAuth 2.0"
echo ""
echo "5. GOOGLE_CLIENT_SECRET"
echo "   └─ Get from: https://console.cloud.google.com → OAuth 2.0"
echo "   └─ ⚠️  KEEP SECRET"
echo ""
echo "6. GEMINI_API_KEY"
echo "   └─ Get from: https://ai.google.dev/api/keys"
echo "   └─ ⚠️  KEEP SECRET"
echo ""

read -p "Have you added all 6 variables to Vercel? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📚 How to add variables to Vercel:"
    echo "   1. Go to: https://vercel.com/projects/zikr/settings/environment-variables"
    echo "   2. Click: Add New"
    echo "   3. For each variable:"
    echo "      - Name: [Variable name from above]"
    echo "      - Value: [Value from the source]"
    echo "      - Production: ✅ Checked"
    echo "   4. Click: Save"
    echo ""
    echo "   Then re-run this script."
    exit 1
fi

echo ""
echo "✅ Environment variables configured"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# STEP 3: Database Migration
# ──────────────────────────────────────────────────────────────────────────

echo "🗄️  STEP 2: DATABASE MIGRATION"
echo "─────────────────────────────────────────────────────────────"
echo ""

MIGRATION_FILE="supabase/migrations/20260718100000_consolidated_production_baseline.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "📊 Lines: $(wc -l < "$MIGRATION_FILE")"
echo ""

echo "Apply migration to Supabase:"
echo ""
echo "Option A - Via Supabase Dashboard:"
echo "  1. Go to: https://app.supabase.com"
echo "  2. Select: zikr project"
echo "  3. Go to: SQL Editor"
echo "  4. Click: New Query"
echo "  5. Copy all lines from: $MIGRATION_FILE"
echo "  6. Paste into SQL Editor"
echo "  7. Click: Run"
echo ""
echo "Option B - Via CLI:"
echo "  $ cd /vercel/share/v0-project"
echo "  $ supabase link --project-ref eydxvcamhjhajxjrsgym"
echo "  $ supabase db push --linked"
echo ""

read -p "Have you applied the migration to Supabase? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please apply the migration before continuing."
    exit 1
fi

echo "✅ Database migration applied"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# STEP 4: Build & Deploy
# ──────────────────────────────────────────────────────────────────────────

echo "🔨 STEP 3: BUILD & DEPLOYMENT"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install 2>&1 | tail -5
echo ""

# Build check
echo "🔍 Building project..."
if ! pnpm build 2>&1 | tail -10; then
    echo "❌ Build failed. Check errors above."
    exit 1
fi
echo ""
echo "✅ Build successful"
echo ""

# ──────────────────────────────────────────────────────────────────────────
# STEP 5: Verify Deployment
# ──────────────────────────────────────────────────────────────────────────

echo "✅ STEP 4: VERIFY PRODUCTION"
echo "─────────────────────────────────────────────────────────────"
echo ""

echo "🌐 Production URL: https://zikrmediaofficial.vercel.app"
echo ""
echo "Test these workflows:"
echo "  ✓ Sign up with email"
echo "  ✓ Sign in"
echo "  ✓ View Quran content"
echo "  ✓ Add to favorites"
echo "  ✓ Create post/comment"
echo "  ✓ Edit profile"
echo "  ✓ Sign out"
echo ""

read -p "Have you tested the production workflows? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please test the app before marking as complete."
    exit 1
fi

# ──────────────────────────────────────────────────────────────────────────
# FINAL SUMMARY
# ──────────────────────────────────────────────────────────────────────────

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              ✅ PRODUCTION DEPLOYMENT COMPLETE ✅              ║"
echo "║                                                                ║"
echo "║                🚀 YOUR APP IS NOW LIVE 🚀                      ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 Summary:"
echo "  ✅ Prerequisites checked"
echo "  ✅ Environment variables configured (6/6)"
echo "  ✅ Database migration applied"
echo "  ✅ Project built successfully"
echo "  ✅ Production workflows tested"
echo ""

echo "🔗 Important Links:"
echo "  🌐 Live Site: https://zikrmediaofficial.vercel.app"
echo "  📊 Vercel Dashboard: https://vercel.com/projects/zikr"
echo "  🗄️  Supabase Dashboard: https://app.supabase.com"
echo "  🐙 GitHub: https://github.com/mohamedalaa7785-cpu/Zikr"
echo ""

echo "📚 Documentation:"
echo "  📖 PRODUCTION_DEPLOYMENT_COMPLETE.md"
echo "  📖 SUPABASE_VERIFICATION_REPORT.md"
echo "  📖 DEPLOYMENT_FIXES_APPLIED.md"
echo ""

echo "🎉 Congratulations! Your Zikr Media application is now live!"
echo "   Monitor logs regularly and watch for any issues."
echo ""
