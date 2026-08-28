import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const tables = [
    'quran_surahs',
    'quran_ayahs',
    'quran_tafsir',
    'quran_reciters',
    'hadith_books',
    'hadiths',
    'hadith_explanations',
    'scholars',
    'stories',
    'prophets',
    'prophet_sections',
    'dua_categories',
    'duas',
    'kids_content',
    'video_categories',
    'videos'
  ];

  console.log('Applying RLS and public read policies...');

  for (const table of tables) {
    try {
      console.log(`Processing table: ${table}`);
      await sql.unsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      
      const policyName = `public_read_${table}_anon`;
      await sql.unsafe(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '${policyName}' AND tablename = '${table}') THEN
                CREATE POLICY "${policyName}" ON public.${table} FOR SELECT TO anon USING (true);
            END IF;
        END $$;
      `);
      console.log(`Applied public read policy to ${table}`);
    } catch (error) {
      console.error(`Error processing ${table}:`, error);
    }
  }

  console.log('RLS policies applied successfully.');
  process.exit(0);
}

main();
