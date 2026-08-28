import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Adding searchable column to duas...');
    await sql`
      ALTER TABLE duas 
      ADD COLUMN IF NOT EXISTS searchable tsvector 
      GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(text_ar,''))) STORED;
    `;
    console.log('Searchable column added.');

    console.log('Adding index to searchable column...');
    await sql`
      CREATE INDEX IF NOT EXISTS duas_search_idx ON duas USING GIN (searchable);
    `;
    console.log('Index added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing duas search:', error);
    process.exit(1);
  }
}

main();
