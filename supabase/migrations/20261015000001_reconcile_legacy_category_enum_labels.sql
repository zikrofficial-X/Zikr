-- Preserve the legacy enum labels retained by the live schema.
-- stories.category was moved to text; the enum is currently unused by table columns.
-- Keeping its labels in the replayed migration chain lets guarded schema-diff checks
-- distinguish migration-history drift from actual schema drift.
ALTER TYPE public.category ADD VALUE IF NOT EXISTS 'prophets';
ALTER TYPE public.category ADD VALUE IF NOT EXISTS 'sahaba';
ALTER TYPE public.category ADD VALUE IF NOT EXISTS 'documentaries';
ALTER TYPE public.category ADD VALUE IF NOT EXISTS 'history';
