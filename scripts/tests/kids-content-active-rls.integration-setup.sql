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
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

CREATE TABLE public.kids_content (
  slug text PRIMARY KEY,
  published boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  shares integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kids_content ENABLE ROW LEVEL SECURITY;

-- Reproduce the production policy that only checks published and therefore
-- still exposes inactive rows until the active-state migration is applied.
CREATE POLICY kids_content_public_read
  ON public.kids_content
  FOR SELECT
  TO public
  USING (published IS TRUE);

GRANT SELECT ON public.kids_content TO PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON public.kids_content TO service_role;

-- Reproduce the legacy share RPC; the migration must restrict it to service_role
-- and align its update predicate with the public active/published visibility rule.
CREATE OR REPLACE FUNCTION public.increment_kids_content_shares(p_slug text)
RETURNS TABLE(slug text, shares integer)
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  UPDATE public.kids_content
  SET shares = coalesce(kids_content.shares, 0) + 1,
      updated_at = now()
  WHERE kids_content.slug = p_slug
    AND kids_content.published IS TRUE
  RETURNING kids_content.slug, kids_content.shares;
$function$;

GRANT EXECUTE ON FUNCTION public.increment_kids_content_shares(text) TO PUBLIC, anon, authenticated, service_role;

INSERT INTO public.kids_content (slug, published, is_active, shares)
VALUES
  ('active-published', true, true, 0),
  ('inactive-published', true, false, 0),
  ('unpublished-active', false, true, 0),
  ('inactive-unpublished', false, false, 0);

DO $legacy_fixture$
BEGIN
  IF NOT has_function_privilege('anon', 'public.increment_kids_content_shares(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Legacy fixture did not reproduce public share-RPC execution';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kids_content'
      AND policyname = 'kids_content_public_read'
      AND qual ILIKE '%published%'
      AND qual NOT ILIKE '%is_active%'
  ) THEN
    RAISE EXCEPTION 'Legacy fixture did not reproduce the published-only Kids content policy';
  END IF;
END
$legacy_fixture$;
