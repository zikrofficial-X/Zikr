# Migration parity audit — 2026-09-01

The linked Supabase production project reports migration versions through `20260901124303`.
The `main` branch tracks the same production versions for the recent Content Hub security cleanup:

- `20260901123902_final_rls_security_cleanup.sql`
- `20260901124136_lock_admin_snapshot_rpc.sql`
- `20260901124303_remove_remaining_content_hub_policy_duplicates.sql`

This file is a no-op documentation marker used to trigger a fresh Supabase Preview run against the current `main` commit after migration filename reconciliation. No production reset or destructive schema operation is intended.
