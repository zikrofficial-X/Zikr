-- Source-indexed Quran expansion: Al Quran Cloud ar.muyassar and mp3quran.net reciter streams.
-- Generated from verified upstream responses; do not edit religious text manually.
ALTER TABLE public.quran_tafsir ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.quran_tafsir ADD COLUMN IF NOT EXISTS retrieved_at timestamptz;
ALTER TABLE public.quran_audio ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.quran_audio ADD COLUMN IF NOT EXISTS retrieved_at timestamptz;
ALTER TABLE public.quran_audio ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
