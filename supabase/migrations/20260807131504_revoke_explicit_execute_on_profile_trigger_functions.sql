-- Remove explicit EXECUTE grants from profile trigger functions when present.
DO $$
DECLARE
  function_name text;
BEGIN
  FOREACH function_name IN ARRAY ARRAY[
    'create_profile_for_new_user',
    'create_profile_on_login',
    'ensure_profile_for_user'
  ] LOOP
    IF to_regprocedure('public.' || function_name || '()') IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I() FROM anon', function_name);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I() FROM authenticated', function_name);
    END IF;
  END LOOP;
END
$$;
