import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Applying Admin RLS policies...');

    const tables = [
      'stories', 'competitions', 'pinned_messages', 'memorization_plans',
      'prophets', 'prophet_sections', 'dua_categories', 'duas',
      'scholars', 'quran_surahs', 'quran_ayahs', 'quran_tafsir', 'quran_reciters',
      'hadith_books', 'hadiths', 'hadith_explanations', 'site_settings'
    ];

    for (const table of tables) {
      console.log(`Setting policies for ${table}...`);
      await sql.unsafe(`
        -- Enable RLS
        ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;

        -- Admin All Access
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_all_${table}' AND tablename = '${table}') THEN
                CREATE POLICY "admin_all_${table}" ON public.${table} 
                FOR ALL 
                TO authenticated 
                USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
                WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
            END IF;
        END $$;
      `);
    }

    console.log('Admin RLS policies applied successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to apply admin policies:', error);
    process.exit(1);
  }
}

main();
