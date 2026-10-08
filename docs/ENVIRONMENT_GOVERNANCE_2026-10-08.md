# ZIKR Environment Governance — 2026-10-08

## Canonical source of truth

Production configuration is owned by:

- GitHub repository: `zikrcontact-del/Zikr`
- Branch: `main`
- Vercel project: `zikr`
- Supabase production project: `wvetcauyerlkqvmntajq`
- Production origin: `https://zikrmediaofficial.vercel.app`

The repository must reference only canonical environment variable names. Legacy duplicate names such as `*_2` are forbidden in runtime/configuration source.

## Vercel target policy

### Production / Preview

Use canonical variables only.

Server secrets remain server-side. Public configuration is limited to values intentionally consumed by browser code.

Legacy duplicate variables found during the 2026-10-08 audit were removed from Production and Preview scope. The Vercel connector does not currently expose a delete operation, so those historical duplicates remain Development-only until deletion is available.

## Supabase variables

Canonical examples include:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` where browser compatibility requires it
- canonical Postgres integration variables supplied by the current Vercel/Supabase integration

Do not introduce suffixed duplicates such as `SUPABASE_URL_2` or `SUPABASE_SERVICE_ROLE_KEY_2`.

## Worker variables

Video/social/English workers receive secrets through their owning CI platform.

- CircleCI owns recurring production workers.
- GitHub Actions owns manual video dispatch and controlled release.
- Supabase pg_cron owns minute-level prayer scheduling.
- Vercel is not a recurring production scheduler.

## Governance checks

Repository hygiene checks reject legacy duplicate environment key references.

Production health checks validate the canonical Supabase endpoint and, when a service-role credential is available to the production worker, verify the admin rate-limit table/RPC contract.

## Rotation

When a secret is suspected to have been exposed, rotate the credential at its source, update the owning environment, and re-run the production health and smoke gates before release.
