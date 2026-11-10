-- Reconcile pre-existing hadiths tables with the original content schema.
-- CREATE TABLE IF NOT EXISTS does not add columns when the table already exists.
-- This additive change restores the optional chapter field used by the admin knowledge editor.
ALTER TABLE public.hadiths
  ADD COLUMN IF NOT EXISTS chapter text;
