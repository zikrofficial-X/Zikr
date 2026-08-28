import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {

    // Quran Surahs
    await sql.unsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quran_surahs' AND column_name='name_translation') THEN
          ALTER TABLE quran_surahs ADD COLUMN name_translation text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quran_surahs' AND column_name='ayahs_count') THEN
          ALTER TABLE quran_surahs ADD COLUMN ayahs_count integer;
        END IF;
      END $$;
    `);

    // Quran Ayahs
    await sql.unsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quran_ayahs' AND column_name='text_ar') THEN
          ALTER TABLE quran_ayahs ADD COLUMN text_ar text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quran_ayahs' AND column_name='text_en') THEN
          ALTER TABLE quran_ayahs ADD COLUMN text_en text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quran_ayahs' AND column_name='audio_url') THEN
          ALTER TABLE quran_ayahs ADD COLUMN audio_url text;
        END IF;
      END $$;
    `);

    // Quran Tafsir
    await sql.unsafe(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quran_tafsir' AND column_name='source') THEN
          ALTER TABLE quran_tafsir RENAME COLUMN source TO author;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quran_tafsir' AND column_name='text') THEN
          ALTER TABLE quran_tafsir RENAME COLUMN text TO tafsir_ar;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quran_tafsir' AND column_name='tafsir_en') THEN
          ALTER TABLE quran_tafsir ADD COLUMN tafsir_en text;
        END IF;
      END $$;
    `);

    // Hadith Books
    await sql.unsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadith_books' AND column_name='source') THEN
          ALTER TABLE hadith_books ADD COLUMN source text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadith_books' AND column_name='author_ar') THEN
          ALTER TABLE hadith_books ADD COLUMN author_ar text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadith_books' AND column_name='author_en') THEN
          ALTER TABLE hadith_books ADD COLUMN author_en text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadith_books' AND column_name='hadith_count') THEN
          ALTER TABLE hadith_books ADD COLUMN hadith_count integer;
        END IF;
      END $$;
    `);

    // Hadiths
    await sql.unsafe(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadiths' AND column_name='narrator') THEN
          ALTER TABLE hadiths RENAME COLUMN narrator TO narrator_ar;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadiths' AND column_name='grade') THEN
          ALTER TABLE hadiths RENAME COLUMN grade TO grade_ar;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadiths' AND column_name='text_en') THEN
          ALTER TABLE hadiths ADD COLUMN text_en text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadiths' AND column_name='narrator_en') THEN
          ALTER TABLE hadiths ADD COLUMN narrator_en text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadiths' AND column_name='grade_en') THEN
          ALTER TABLE hadiths ADD COLUMN grade_en text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadiths' AND column_name='chapter') THEN
          ALTER TABLE hadiths ADD COLUMN chapter text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadiths' AND column_name='ref') THEN
          ALTER TABLE hadiths ADD COLUMN ref text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hadiths' AND column_name='published') THEN
          ALTER TABLE hadiths ADD COLUMN published boolean DEFAULT true;
        END IF;
      END $$;
    `);

    process.exit(0);
  } catch (error) {
    console.error('Error aligning schema:', error);
    process.exit(1);
  }
}

main();
