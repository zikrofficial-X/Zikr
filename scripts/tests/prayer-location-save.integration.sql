\set ON_ERROR_STOP on
SET TIME ZONE 'UTC';

DO $privileges$
BEGIN
  IF has_function_privilege(
    'anon',
    'public.save_default_prayer_location(text,text,numeric,numeric,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'anon must not execute save_default_prayer_location';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.save_default_prayer_location(text,text,numeric,numeric,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'authenticated must execute save_default_prayer_location';
  END IF;
END
$privileges$;

CREATE OR REPLACE FUNCTION public.reject_prayer_location_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.city = 'Reject Insert' THEN
    RAISE EXCEPTION 'simulated prayer-location insert failure';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER reject_prayer_location_insert
BEFORE INSERT ON public.prayer_locations
FOR EACH ROW
EXECUTE FUNCTION public.reject_prayer_location_insert();

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', false);

DO $existing_location$
DECLARE
  v_before uuid;
  v_result record;
BEGIN
  SELECT id INTO v_before
  FROM public.prayer_locations
  WHERE user_id = auth.uid()
    AND city = 'Cairo'
    AND is_default IS TRUE;

  SELECT * INTO v_result
  FROM public.save_default_prayer_location('Cairo', 'Egypt', 30.0444, 31.2357, 'Africa/Cairo');

  IF v_result.created IS DISTINCT FROM false OR v_result.id IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'Expected an update of the existing Cairo location, received %', row_to_json(v_result);
  END IF;
END
$existing_location$;

DO $new_location$
DECLARE
  v_result record;
BEGIN
  SELECT * INTO v_result
  FROM public.save_default_prayer_location('Alexandria', 'Egypt', 31.2001, 29.9187, 'Africa/Cairo');

  IF v_result.created IS DISTINCT FROM true OR v_result.is_default IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Expected a newly inserted default Alexandria location, received %', row_to_json(v_result);
  END IF;

  IF (
    SELECT count(*)
    FROM public.prayer_locations
    WHERE user_id = auth.uid()
      AND is_default IS TRUE
  ) <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one default location after the save';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.prayer_locations
    WHERE user_id = auth.uid()
      AND city = 'Cairo'
      AND is_default IS TRUE
  ) THEN
    RAISE EXCEPTION 'The previous Cairo location must remain saved but not default';
  END IF;

  IF (
    SELECT count(*)
    FROM public.prayer_locations
    WHERE user_id = '10000000-0000-4000-8000-000000000002'
  ) <> 0 THEN
    RAISE EXCEPTION 'RLS must hide another user''s prayer locations';
  END IF;
END
$new_location$;

DO $rollback$
DECLARE
  v_failed boolean := false;
BEGIN
  BEGIN
    PERFORM 1
    FROM public.save_default_prayer_location('Reject Insert', 'Egypt', 29.9, 31.2, 'Africa/Cairo');
  EXCEPTION WHEN OTHERS THEN
    v_failed := true;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'Expected the simulated insert failure';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.prayer_locations
    WHERE user_id = auth.uid()
      AND city = 'Alexandria'
      AND is_default IS TRUE
  ) THEN
    RAISE EXCEPTION 'The previous default must survive a failed replacement insert';
  END IF;

  IF (
    SELECT count(*)
    FROM public.prayer_locations
    WHERE user_id = auth.uid()
      AND is_default IS TRUE
  ) <> 1 THEN
    RAISE EXCEPTION 'A failed replacement must not leave zero or multiple default locations';
  END IF;
END
$rollback$;

DO $invalid_coordinates$
DECLARE
  v_failed boolean := false;
BEGIN
  BEGIN
    PERFORM 1
    FROM public.save_default_prayer_location('Invalid', 'Egypt', 91, 31, 'Africa/Cairo');
  EXCEPTION WHEN OTHERS THEN
    v_failed := true;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'Out-of-range coordinates must be rejected';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.prayer_locations
    WHERE user_id = auth.uid()
      AND city = 'Alexandria'
      AND is_default IS TRUE
  ) THEN
    RAISE EXCEPTION 'Invalid coordinates must not change the existing default';
  END IF;
END
$invalid_coordinates$;

RESET ROLE;
