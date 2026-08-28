-- Add an atomic share counter for kids content.
ALTER TABLE public.kids_content
  ADD COLUMN IF NOT EXISTS shares integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_kids_content_shares(p_slug text)
RETURNS TABLE (slug text, shares integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.kids_content
  SET shares = shares + 1,
      updated_at = now()
  WHERE kids_content.slug = p_slug
    AND kids_content.published = true
  RETURNING kids_content.slug, kids_content.shares;
$$;

REVOKE ALL ON FUNCTION public.increment_kids_content_shares(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_kids_content_shares(text) TO service_role;

CREATE INDEX IF NOT EXISTS kids_content_published_slug_idx
  ON public.kids_content (slug)
  WHERE published = true;

COMMENT ON FUNCTION public.increment_kids_content_shares(text) IS
  'Atomically increments the share count for published kids content.';

COMMENT ON COLUMN public.kids_content.shares IS
  'Total share events recorded for this published kids item.';

-- Keep generated client types aligned with the canonical schema.
UPDATE public.kids_content
SET shares = 0
WHERE shares IS NULL;

ALTER TABLE public.kids_content
  ALTER COLUMN shares SET NOT NULL;

GRANT SELECT ON public.kids_content TO anon, authenticated;

-- The application invokes this RPC only through its server-side service-role client.
