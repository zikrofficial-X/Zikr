-- Compatibility guards for legacy content tables before the general content seed.
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS title_ar TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS content_ar TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT,
  ADD COLUMN IF NOT EXISTS summary_ar TEXT,
  ADD COLUMN IF NOT EXISTS summary_en TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
