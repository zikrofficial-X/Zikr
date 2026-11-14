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

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
  SELECT COALESCE(current_setting('test.is_admin', true), 'false') = 'true';
$function$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_user() TO authenticated;

CREATE TABLE public.prophets (
  id uuid PRIMARY KEY,
  published boolean NOT NULL DEFAULT false
);

CREATE TABLE public.prophet_sections (
  id uuid PRIMARY KEY,
  prophet_id uuid NOT NULL REFERENCES public.prophets(id),
  title_ar text NOT NULL
);

ALTER TABLE public.prophet_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_public_read
  ON public.prophet_sections
  FOR SELECT
  TO public
  USING (true);

GRANT SELECT ON public.prophets, public.prophet_sections TO anon, authenticated;

INSERT INTO public.prophets (id, published)
VALUES
  ('40000000-0000-4000-8000-000000000001', true),
  ('40000000-0000-4000-8000-000000000002', false);

INSERT INTO public.prophet_sections (id, prophet_id, title_ar)
VALUES
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'قسم منشور'),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'قسم مسودة');
