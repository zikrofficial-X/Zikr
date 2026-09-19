# ZIKR Canonical Supabase Auth Configuration

This file is the operator contract for the production Authentication → URL Configuration page.

## Immutable production values

**Site URL**

`https://zikrmediaofficial.vercel.app`

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

GitHub Actions are intentionally retired from the active repository. No workflow is responsible for pushing or enforcing Supabase Auth configuration.

The canonical configuration is enforced by the repository configuration plus the normal deployment/verification path. Any manual dashboard change must preserve the exact three-value contract above.

## Rules

Do not add Vercel preview/deployment aliases to Supabase Auth Redirect URLs.
Do not replace the application callback with the Supabase provider callback.
Do not add a duplicate localhost callback while `http://localhost:3000/**` is present.
Do not rename or remove the canonical production host without updating the protected contract, application auth guards, and verification scripts together.
