import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Applying final schema refinements...');

    // Ensure Prophets table has the exact columns from schema.ts
    await sql.unsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prophets' AND column_name='birth_place_ar') THEN
          ALTER TABLE prophets ADD COLUMN birth_place_ar text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prophets' AND column_name='death_place_ar') THEN
          ALTER TABLE prophets ADD COLUMN death_place_ar text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prophets' AND column_name='featured_image_url') THEN
          ALTER TABLE prophets ADD COLUMN featured_image_url text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prophets' AND column_name='order_num') THEN
          ALTER TABLE prophets ADD COLUMN order_num integer DEFAULT 0;
        END IF;
      END $$;
    `);

    // Ensure Duas table has the exact columns from schema.ts
    await sql.unsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='duas' AND column_name='occasion_ar') THEN
          ALTER TABLE duas ADD COLUMN occasion_ar text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='duas' AND column_name='occasion_en') THEN
          ALTER TABLE duas ADD COLUMN occasion_en text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='duas' AND column_name='benefits_ar') THEN
          ALTER TABLE duas ADD COLUMN benefits_ar text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='duas' AND column_name='benefits_en') THEN
          ALTER TABLE duas ADD COLUMN benefits_en text;
        END IF;
      END $$;
    `);

    console.log('Final refinements completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Final refinements failed:', error);
    process.exit(1);
  }
}

main();
