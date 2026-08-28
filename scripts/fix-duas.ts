import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Creating dua_categories table...');
    await sql.unsafe(`
      create table if not exists dua_categories (
        id uuid primary key default gen_random_uuid(),
        name_ar text not null,
        name_en text not null,
        slug text unique not null,
        description_ar text,
        description_en text,
        icon text,
        published boolean default true,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      );
    `);

    console.log('Ensuring duas table has category_id and proper constraints...');
    // If duas already exists, ensure category_id is there
    await sql.unsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='duas' AND column_name='category_id') THEN
          ALTER TABLE duas ADD COLUMN category_id uuid REFERENCES dua_categories(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    console.log('Dua tables fixed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing dua tables:', error);
    process.exit(1);
  }
}

main();
