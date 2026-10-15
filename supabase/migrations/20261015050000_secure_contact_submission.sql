-- Route all public contact submissions through the validated server API.
-- The server uses createAdminClient after validation and rate limiting.
-- This prevents direct PostgREST writes from bypassing request validation.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.contacts
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS contacts_public_insert ON public.contacts;
