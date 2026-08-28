import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.replace(/\/rest\/v1\/?$/, '');
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_KEY;

async function main() {
  if (!supabaseUrl || !anonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const tables = [
    'quran_surahs',
    'quran_ayahs',
    'quran_tafsir',
    'hadith_books',
    'hadiths',
    'duas',
    'prophets',
    'prophet_sections',
    'battles',
    'battle_events',
    'conquests',
    'conquest_events',
    'articles',
    'kids_content',
    'companions',
    'companion_stories',
    'videos',
  ];
  let failures = 0;

  for (const table of tables) {
    try {
      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?select=*&limit=1`;
      console.log(`Checking public read for table: ${table} at ${url}`);
      
      const response = await fetch(url, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      console.log(`Response status for ${table}: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Successfully read from ${table}. Rows found: ${Array.isArray(data) ? data.length : 'unknown'}`);
      } else {
        failures += 1;
        const errorText = await response.text();
        console.error(`Read from ${table} failed:`, errorText);
      }
    } catch (error) {
      failures += 1;
      console.error(`Error checking ${table}:`, error);
    }
    console.log('---');
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main();
