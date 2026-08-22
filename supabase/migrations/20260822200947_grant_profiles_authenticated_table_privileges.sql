-- Allow authenticated users to use the profiles table API.
-- Row-level security policies remain the boundary: users can only access their own row.
grant select, insert, update, delete on table public.profiles to authenticated;
