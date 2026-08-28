-- Avoid per-row evaluation of auth.uid() in RLS policies.
-- Policies already using a SELECT initplan are left unchanged.
DO $$
DECLARE
  policy_row record;
  using_expr text;
  check_expr text;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        coalesce(qual, '') LIKE '%auth.uid()%' OR
        coalesce(with_check, '') LIKE '%auth.uid()%'
      )
      AND coalesce(qual, '') NOT LIKE '%SELECT auth.uid()%'
      AND coalesce(with_check, '') NOT LIKE '%SELECT auth.uid()%'
  LOOP
    using_expr := regexp_replace(
      policy_row.qual,
      'auth\\.uid\\(\\)',
      '(select auth.uid())',
      'g'
    );
    check_expr := regexp_replace(
      policy_row.with_check,
      'auth\\.uid\\(\\)',
      '(select auth.uid())',
      'g'
    );

    IF policy_row.qual IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING %s',
        policy_row.policyname,
        policy_row.schemaname,
        policy_row.tablename,
        using_expr
      );
    END IF;

    IF policy_row.with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I WITH CHECK %s',
        policy_row.policyname,
        policy_row.schemaname,
        policy_row.tablename,
        check_expr
      );
    END IF;
  END LOOP;
END;
$$;
