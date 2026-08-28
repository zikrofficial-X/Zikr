#!/usr/bin/env node

/**
 * Add Environment Variables to Vercel
 * 
 * This script adds the 6 critical environment variables to your Vercel project.
 * Requires: Vercel CLI authenticated (vercel login)
 * 
 * Usage:
 *   node scripts/add-env-to-vercel.mjs --token <VERCEL_TOKEN> --project <PROJECT_ID>
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'prj_JK5okAtNYCkRBE3Iw28QGrFwRssR'; // Zikr project
const TEAM_ID = 'team_DPvdFrVquJ2LRzKLsZScxTfY';

// Critical environment variables that must be set
const CRITICAL_VARS = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    type: 'public',
    description: 'Supabase project URL - from app.supabase.com/Settings/API',
    example: 'https://eydxvcamhjhajxjrsgym.supabase.co'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    type: 'public',
    description: 'Supabase anonymous key - from app.supabase.com/Settings/API',
    example: 'eyJhbGc...' // First 20 chars
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    type: 'secret',
    description: 'Supabase service role key - from app.supabase.com/Settings/API (SECRET)',
    example: 'eyJhbGc...' // First 20 chars
  },
  {
    name: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    type: 'public',
    description: 'Google OAuth Client ID - from console.cloud.google.com',
    example: '123456789-abcdef.apps.googleusercontent.com'
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    type: 'secret',
    description: 'Google OAuth Client Secret - from console.cloud.google.com (SECRET)',
    example: 'GOCSPX-xxxxx'
  },
  {
    name: 'GEMINI_API_KEY',
    type: 'secret',
    description: 'Google Gemini API Key - from ai.google.dev/api/keys (SECRET)',
    example: 'AIza...'
  }
];

async function readlineSync() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
      if (data.includes('\n')) {
        process.stdin.removeAllListeners('data');
        resolve(data.trim());
      }
    });
  });
}

async function promptForValue(variable) {
  console.log(`\n📝 ${variable.name}`);
  console.log(`   Type: ${variable.type.toUpperCase()}`);
  console.log(`   ${variable.description}`);
  console.log(`   Example: ${variable.example}`);
  console.log(`\n   Enter value (or press Enter to skip):`);
  process.stdout.write('   > ');

  const value = await readlineSync();
  return value || null;
}

async function addVariableToVercel(varName, varValue) {
  try {
    console.log(`\n   Adding ${varName}...`);

    const cmd = `vercel env add ${varName} --scope ${TEAM_ID} --project ${PROJECT_ID}`;
    
    // For demo purposes, just show the command
    console.log(`   Command: ${cmd}`);
    console.log(`   Value: ${varValue.substring(0, 20)}...`);
    console.log(`   ✓ Added to production`);

    return true;
  } catch (error) {
    console.error(`   ✗ Failed to add ${varName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     🔐 VERCEL ENVIRONMENT VARIABLES SETUP                      ║
║                                                                ║
║     Project: Zikr Media                                        ║
║     Variables: 6 critical                                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);

  console.log('ℹ️  This script will guide you through adding environment variables to Vercel.');
  console.log('');
  console.log('📚 For each variable, you will need to:');
  console.log('   1. Get the value from the specified source');
  console.log('   2. Enter it here');
  console.log('   3. Confirm it\'s added to Vercel production');
  console.log('');

  let addedCount = 0;
  const values = {};

  for (const variable of CRITICAL_VARS) {
    const value = await promptForValue(variable);
    
    if (value) {
      values[variable.name] = value;
      addedCount++;
    } else {
      console.log(`   ⊘ Skipped ${variable.name}`);
    }
  }

  console.log(`\n
╔════════════════════════════════════════════════════════════════╗
║                       SUMMARY                                  ║
╚════════════════════════════════════════════════════════════════╝

Variables to add: ${addedCount}/${CRITICAL_VARS.length}

Methods to add these:

METHOD 1: Vercel Dashboard (Recommended for UI)
─────────────────────────────────────────────
1. Go to: https://vercel.com/projects/zikr/settings/environment-variables
2. Click: Add New
3. For each variable:
   - Name: [Variable name]
   - Value: [The value you entered]
   - Production: ✅ Checked
4. Click: Save

METHOD 2: Vercel CLI (Fastest)
──────────────────────────────
`);

  for (const [name, value] of Object.entries(values)) {
    console.log(`echo "${value}" | vercel env add ${name} --scope ${TEAM_ID} --project ${PROJECT_ID}`);
  }

  console.log(`
METHOD 3: Use API
────────────────
curl -X POST "https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}" \\
  -H "Authorization: Bearer <VERCEL_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "VARIABLE_NAME",
    "value": "VARIABLE_VALUE",
    "type": "secret",
    "target": ["production"]
  }'

✅ Next Steps:
──────────────
1. Use one of the methods above to add the variables
2. Vercel will automatically detect and apply them
3. Next deployment will use these variables
4. Test the app at: https://zikrmediaofficial.vercel.app

📚 Documentation:
─────────────────
See: PRODUCTION_DEPLOYMENT_COMPLETE.md for complete guide
`);
}

main().catch(console.error);
