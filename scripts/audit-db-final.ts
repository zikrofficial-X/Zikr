import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Starting final database audit...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const tableNames = tables.map(t => t.table_name);
    console.log('Found tables:', tableNames.join(', '));

    const expectedTables = [
      'profiles', 'favorites', 'reading_progress', 'reminders',
      'quran_surahs', 'quran_ayahs', 'quran_tafsir', 'quran_reciters',
      'hadith_books', 'hadiths', 'hadith_explanations',
      'scholars', 'stories', 'user_subscriptions', 'payments',
      'research_requests', 'generated_research', 'site_settings',
      'competitions', 'pinned_messages', 'memorization_plans',
      'prophets', 'prophet_sections', 'dua_categories', 'duas'
    ];

    const missingTables = expectedTables.filter(t => !tableNames.includes(t));
    if (missingTables.length > 0) {
      console.error('Missing tables:', missingTables.join(', '));
    } else {
      console.log('All expected tables exist.');
    }

    // Check specific critical columns for alignment
    const columnsCheck = await sql`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('quran_ayahs', 'hadiths', 'quran_tafsir')
    `;

    console.log('Checking critical column names...');
    const criticalChecks = [
      { table: 'quran_ayahs', column: 'text_ar' },
      { table: 'hadiths', column: 'text_ar' },
      { table: 'hadiths', column: 'narrator_ar' },
      { table: 'hadiths', column: 'grade_ar' },
      { table: 'quran_tafsir', column: 'tafsir_ar' },
      { table: 'quran_tafsir', column: 'author' }
    ];

    for (const check of criticalChecks) {
      const exists = columnsCheck.some(c => c.table_name === check.table && c.column_name === check.column);
      if (exists) {
        console.log(`✓ ${check.table}.${check.column} exists.`);
      } else {
        console.error(`✗ ${check.table}.${check.column} is MISSING!`);
      }
    }

    process.exit(missingTables.length === 0 ? 0 : 1);
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

main();
