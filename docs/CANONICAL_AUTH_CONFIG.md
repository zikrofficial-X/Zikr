# ZIKR Canonical Supabase Auth Configuration

This file is the operator contract for the production Authentication → URL Configuration page.

## Immutable production values

**Site URL**

`https://zikrmediaofficial.vercel.app/`

**Redirect URLs — exactly three**

1. `com.zikr.app://auth/callback`
2. `http://localhost:3000/**`
3. `https://zikrmediaofficial.vercel.app/auth/callback`

No fourth redirect URL is part of the production contract.

## Source of truth

The repository copy is:

`supabase/config.toml`

The verification script is:

`scripts/verify-canonical-config.mjs`

The repository gate invokes it through:

`pnpm canonical:check`

## Remote enforcement

`.github/workflows/supabase-auth-config-lock.yml` pushes `supabase/config.toml` to the linked production Supabase project when the workflow runs.

The workflow requires the GitHub Actions secret:

`SUPABASE_ACCESS_TOKEN`

A manual dashboard change is therefore not a new source of truth; the repository configuration remains canonical.

## Rules

Do not add Vercel preview/deployment aliases to Supabase Auth Redirect URLs.
Do not replace the application callback with the Supabase provider callback.
Do not add a duplicate localhost callback while `http://localhost:3000/**` is present.
Do not rename or remove the canonical production host without updating the protected contract, application auth guards, and verification workflow together.
