DO $roles$
BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

DO $roles$
BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

DO $roles$
BEGIN
  CREATE ROLE service_role NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $function$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$function$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY
);

CREATE TABLE public.prayer_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city text NOT NULL,
  country text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  timezone text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX prayer_locations_one_default_per_user_idx
  ON public.prayer_locations (user_id)
  WHERE is_default;

ALTER TABLE public.prayer_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY prayer_locations_owner_all
  ON public.prayer_locations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT USAGE ON SCHEMA public, auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.prayer_locations TO authenticated;

INSERT INTO public.profiles (id)
VALUES
  ('10000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002');

INSERT INTO public.prayer_locations (
  id, user_id, city, country, latitude, longitude, timezone, is_default
)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Cairo', 'Egypt', 30.0444, 31.2357, 'Africa/Cairo', true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'New York', 'USA', 40.7128, -74.0060, 'America/New_York', true
  );
