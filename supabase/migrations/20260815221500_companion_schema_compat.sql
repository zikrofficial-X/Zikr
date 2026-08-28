-- Compatibility guards for legacy companions before the story expansion.
ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS title_ar TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS bio_ar TEXT,
  ADD COLUMN IF NOT EXISTS bio_en TEXT,
  ADD COLUMN IF NOT EXISTS order_num INTEGER,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
