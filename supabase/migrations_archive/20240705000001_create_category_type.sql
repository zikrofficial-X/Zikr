-- Migration: Create category enum type for stories
-- Generated: 2024-07-05

-- Create the enum used by the stories.category column.
-- Adjust values below if you want to include additional story categories.

CREATE TYPE public.category AS ENUM (
  'faith',
  'prophets',
  'sahaba',
  'documentaries',
  'history'
);
