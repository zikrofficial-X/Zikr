-- Restored source for the already-applied production migration 20261030071426.
-- The definitions below were verified against pg_indexes on the canonical
-- Supabase project on 2026-10-30. IF NOT EXISTS keeps replay safe when the
-- indexes are already present in a restored or production database.

CREATE INDEX IF NOT EXISTS idx_admin_queue_alert_deliveries_created_at
  ON public.admin_queue_alert_deliveries USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_queue_alert_deliveries_queue
  ON public.admin_queue_alert_deliveries USING btree (queue_name, created_at DESC);
