import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Adding unique constraint to hadiths...');
    await sql`
      ALTER TABLE hadiths 
      ADD CONSTRAINT hadiths_book_id_hadith_number_key 
      UNIQUE (book_id, hadith_number);
    `;
    console.log('Constraint added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error adding constraint:', error);
    process.exit(1);
  }
}

main();
