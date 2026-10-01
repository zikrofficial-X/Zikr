-- Migration-history reconciliation marker.
-- The live schema already contains the objects created by the legacy 20260929
-- migration. The old 8-digit history row was repaired to this timestamp so
-- hosted Supabase migration checks no longer hit the 8-digit/14-digit ordering bug.
select 1;
