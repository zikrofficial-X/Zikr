-- Revoke public EXECUTE from profile trigger functions when they exist.
-- Some historical schema paths do not create every helper function; the
-- migration must remain replayable on a clean preview branch.
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
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I() FROM PUBLIC', function_name);
    END IF;
  END LOOP;
END
$$;
