# Admin 2.0 CI validation gate

The Admin 2.0 branch must pass the repository's existing verification chain before merge:

- project integrity
- local import validation
- Supabase migration validation and replay
- platform route validation
- TypeScript
- ESLint
- unit/integration tests
- production build

Do not merge while any of these checks fail. Production OAuth and provider publishing tests must run separately with protected GitHub/Vercel secrets; credentials must never be committed to the repository.
