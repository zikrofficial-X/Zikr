-- Migration: 20260807_0020_cancel_billing.sql
-- Purpose: Emergency migration to cancel all subscriptions and reject all pending payments.
-- WARNING: This migration updates production data. Take a full DB backup before applying.


-- Create a lightweight audit table (idempotent) to record the admin action.
CREATE TABLE IF NOT EXISTS public.admin_actions_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Record a global-cancellation audit row (for visibility)
INSERT INTO public.admin_actions_audit (user_id, action, meta)
VALUES (NULL, 'cancel_billing_globally', jsonb_build_object('reason','requested-by-owner','timestamp', now()));

-- 1) Reset all user_subscriptions to the canonical free plan.
-- The deployed schema contains plan/credits/expires_at, but does not contain
-- the legacy auto_renew or is_active columns.
UPDATE public.user_subscriptions
SET plan = 'free',
    updated_at = now()
WHERE plan IS DISTINCT FROM 'free';

-- 2) Mark all pending payments as rejected so they no longer count as outstanding
UPDATE public.payments
SET status = 'rejected',
    reference_note = coalesce(reference_note,'') || ' | cancelled-globally-at-' || now()
WHERE status = 'pending';


-- NOTES:
-- 1) This migration only updates the application database. If you accepted payments via an external
--    gateway (Stripe/PayPal/other), you must still cancel subscriptions and issue refunds via that provider's
--    dashboard or API. This migration does NOT contact external gateways.
-- 2) Take a full database backup before applying. Example:
--    pg_dump "$DATABASE_URL" > zikr-backup-$(date +%Y%m%dT%H%M%S).sql
-- 3) To apply this migration, run your normal migration flow (supabase migrations or drizzle, depending on your deployment).
