-- Remove legacy duplicate public-read policies after verifying they are
-- semantically identical to the canonical public_read_* policies.
DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT * FROM (VALUES
      ('quran_audio', 'Public can read audio'),
      ('quran_reciters', 'Public can read reciters'),
      ('quran_tafsir', 'Public can read tafsir'),
      ('stories', 'Public Read Stories'),
      ('tawasheeh', 'Public can read tawasheeh'),
      ('tawasheeh_categories', 'Public can read tawasheeh categories')
    ) AS v(table_name, policy_name)
  LOOP
    IF to_regclass(format('public.%I', policy_row.table_name)) IS NOT NULL THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        policy_row.policy_name,
        policy_row.table_name
      );
    END IF;
  END LOOP;
END;
$$;
