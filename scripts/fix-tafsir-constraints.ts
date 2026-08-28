import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Adding unique constraint to quran_tafsir...');
    await sql`
      ALTER TABLE quran_tafsir 
      ADD CONSTRAINT quran_tafsir_surah_id_ayah_number_author_key 
      UNIQUE (surah_id, ayah_number, author);
    `;
    console.log('Constraint added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error adding constraint:', error);
    process.exit(1);
  }
}

main();
