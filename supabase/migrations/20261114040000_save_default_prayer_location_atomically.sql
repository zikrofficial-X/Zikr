BEGIN;

CREATE OR REPLACE FUNCTION public.save_default_prayer_location(
  p_city text,
  p_country text,
  p_latitude numeric,
  p_longitude numeric,
  p_timezone text
)
RETURNS TABLE (
  id uuid,
  city text,
  country text,
  latitude numeric,
  longitude numeric,
  timezone text,
  is_default boolean,
  updated_at timestamptz,
  created boolean
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_city text;
  v_country text;
  v_timezone text;
  v_existing public.prayer_locations%ROWTYPE;
  v_location public.prayer_locations%ROWTYPE;
  v_existing_found boolean := false;
  v_created boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '28000';
  END IF;

  IF p_city IS NULL OR char_length(btrim(p_city)) NOT BETWEEN 1 AND 160 THEN
    RAISE EXCEPTION 'invalid_city' USING ERRCODE = '22023';
  END IF;

  IF p_country IS NOT NULL AND char_length(btrim(p_country)) > 160 THEN
    RAISE EXCEPTION 'invalid_country' USING ERRCODE = '22023';
  END IF;

  IF p_latitude IS NULL OR p_latitude < -90 OR p_latitude > 90
     OR p_longitude IS NULL OR p_longitude < -180 OR p_longitude > 180 THEN
    RAISE EXCEPTION 'invalid_coordinates' USING ERRCODE = '22023';
  END IF;

  IF p_timezone IS NULL
     OR char_length(btrim(p_timezone)) NOT BETWEEN 1 AND 120
     OR NOT EXISTS (
       SELECT 1
       FROM pg_catalog.pg_timezone_names AS timezone_name
       WHERE timezone_name.name = btrim(p_timezone)
     ) THEN
    RAISE EXCEPTION 'invalid_timezone' USING ERRCODE = '22023';
  END IF;

  v_city := btrim(p_city);
  v_country := nullif(btrim(coalesce(p_country, '')), '');
  v_timezone := btrim(p_timezone);

  -- Serialize updates for one user even when that user has no saved location row.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );

  SELECT location.*
  INTO v_existing
  FROM public.prayer_locations AS location
  WHERE location.user_id = v_user_id
    AND location.city = v_city
    AND location.latitude = p_latitude
    AND location.longitude = p_longitude
  ORDER BY location.updated_at DESC, location.created_at DESC
  LIMIT 1
  FOR UPDATE;

  v_existing_found := FOUND;

  -- This and the subsequent insert/update commit or roll back as one transaction.
  UPDATE public.prayer_locations AS location
  SET is_default = false,
      updated_at = pg_catalog.now()
  WHERE location.user_id = v_user_id
    AND location.is_default IS TRUE;

  IF v_existing_found THEN
    UPDATE public.prayer_locations AS location
    SET city = v_city,
        country = v_country,
        latitude = p_latitude,
        longitude = p_longitude,
        timezone = v_timezone,
        is_default = true,
        updated_at = pg_catalog.now()
    WHERE location.id = v_existing.id
      AND location.user_id = v_user_id
    RETURNING location.* INTO v_location;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'prayer_location_changed' USING ERRCODE = '40001';
    END IF;
  ELSE
    INSERT INTO public.prayer_locations (
      user_id,
      city,
      country,
      latitude,
      longitude,
      timezone,
      is_default,
      updated_at
    )
    VALUES (
      v_user_id,
      v_city,
      v_country,
      p_latitude,
      p_longitude,
      v_timezone,
      true,
      pg_catalog.now()
    )
    RETURNING * INTO v_location;

    v_created := true;
  END IF;

  RETURN QUERY
  SELECT
    v_location.id,
    v_location.city,
    v_location.country,
    v_location.latitude,
    v_location.longitude,
    v_location.timezone,
    v_location.is_default,
    v_location.updated_at,
    v_created;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_default_prayer_location(text, text, numeric, numeric, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_default_prayer_location(text, text, numeric, numeric, text)
  TO authenticated;

COMMIT;
