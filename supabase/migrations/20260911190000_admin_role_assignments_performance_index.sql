-- Performance hardening: cover the created_by foreign key on admin_role_assignments.
-- This is intentionally additive and does not alter RLS semantics.
create index if not exists admin_role_assignments_created_by_idx
  on public.admin_role_assignments (created_by);
