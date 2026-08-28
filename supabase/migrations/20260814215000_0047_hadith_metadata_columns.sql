-- Keep the public Hadith schema compatible with the Drizzle model and content seed.
ALTER TABLE public.hadith_books
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'Open-Hadith-Data',
  ADD COLUMN IF NOT EXISTS author_ar TEXT,
  ADD COLUMN IF NOT EXISTS author_en TEXT,
  ADD COLUMN IF NOT EXISTS hadith_count INTEGER;

ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS year_hijri INTEGER;

ALTER TABLE public.hadiths
  ADD COLUMN IF NOT EXISTS ref TEXT,
  ADD COLUMN IF NOT EXISTS text_en TEXT,
  ADD COLUMN IF NOT EXISTS narrator_ar TEXT,
  ADD COLUMN IF NOT EXISTS narrator_en TEXT,
  ADD COLUMN IF NOT EXISTS grade_ar TEXT,
  ADD COLUMN IF NOT EXISTS grade_en TEXT;
