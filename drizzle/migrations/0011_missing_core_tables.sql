-- 0011_missing_core_tables.sql
-- Closes schema drift: these 4 tables are queried by app code and referenced by
-- RLS policies in 0010, but had no CREATE TABLE statement in the repo migrations.
-- Fully idempotent — safe to run against the live database.

-- favorites (used by app/favorites/actions.ts and app/api/user/favorites)
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_ref)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- hadiths (used by lib/services/hadith.ts)
CREATE TABLE IF NOT EXISTS hadiths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  hadith_number integer NOT NULL,
  text_ar text NOT NULL,
  narrator_ar text,
  ref text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, hadith_number)
);
CREATE INDEX IF NOT EXISTS idx_hadiths_book_number ON hadiths(book_id, hadith_number);

-- quran_ayahs (used by lib/services/quran-server.ts)
CREATE TABLE IF NOT EXISTS quran_ayahs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_id integer NOT NULL,
  ayah_number integer NOT NULL,
  text_ar text,
  text_en text,
  text_uthmani text,
  text_simple text,
  audio_url text,
  page integer,
  juz integer,
  hizb integer,
  rub integer,
  sajda boolean DEFAULT false,
  UNIQUE (surah_id, ayah_number)
);
CREATE INDEX IF NOT EXISTS idx_quran_ayahs_surah ON quran_ayahs(surah_id, ayah_number);

-- quran_tafsir (used by lib/services/quran-server.ts)
CREATE TABLE IF NOT EXISTS quran_tafsir (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_id integer NOT NULL,
  ayah_number integer NOT NULL,
  tafsir_ar text NOT NULL,
  source text,
  UNIQUE (surah_id, ayah_number)
);
CREATE INDEX IF NOT EXISTS idx_quran_tafsir_surah ON quran_tafsir(surah_id, ayah_number);

-- RLS (mirrors 0010_full_schema_rls.sql — repeated here so a fresh rebuild
-- that runs this file gets secure defaults even if 0010 ran before tables existed)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadiths ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_tafsir ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'favorites' AND policyname = 'favorites_all_own') THEN
    CREATE POLICY "favorites_all_own" ON favorites USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hadiths' AND policyname = 'hadiths_public_read') THEN
    CREATE POLICY "hadiths_public_read" ON hadiths FOR SELECT USING (published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quran_ayahs' AND policyname = 'quran_ayahs_public_read') THEN
    CREATE POLICY "quran_ayahs_public_read" ON quran_ayahs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quran_tafsir' AND policyname = 'quran_tafsir_public_read') THEN
    CREATE POLICY "quran_tafsir_public_read" ON quran_tafsir FOR SELECT USING (true);
  END IF;
END
$$;
