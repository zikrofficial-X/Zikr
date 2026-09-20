# ZIKR GitHub Migration Handoff — 2026-09-20

## Source repository
- Current repository: `Zikrmediaofficial/Zikr`
- Default branch: `main`
- Migration branch: `migration-ready-20260920`
- Migration source HEAD: `58ec29514a9738a96e798b8c59e847a13b30fbe1`
- Migration branch was created from the verified repository HEAD; the old `finalization-src-20260920` ref is not currently present as a GitHub branch.

## What is ready
- Full repository source is preserved on the migration branch.
- `package.json` + `pnpm-lock.yaml` are retained.
- Node requirement: 22.x.
- Package manager: pnpm 9.15.0.
- Vercel install/build contract: `pnpm install --frozen-lockfile` then `pnpm build`.
- `.gitignore` excludes local env files, Vercel state, Android signing material and build artifacts.
- `.env.example` contains placeholders only; production secrets must be recreated in the new provider integrations.
- GitHub Actions are intentionally retired; CircleCI remains the external CI/recovery configuration.
- Supabase deployment migrations remain under `supabase/migrations/` as the canonical chain.
- Android/iOS native projects are included.

## Credentials / integrations that must be re-linked after transfer
Do not copy secrets from local files into Git history.

Reconfigure protected values in the new environment:
- Vercel project environment variables
- Supabase project credentials / service-role secret
- Google OAuth provider configuration
- YouTube publishing credentials
- Facebook/Meta publishing credentials
- Gemini / AI credentials
- Cloudinary credentials
- Webhook secret
- CircleCI project/context variables
- Android release signing secrets
- GitHub token / CLI credentials used by CircleCI release publication

## Canonical production URLs
- Site: https://zikrmediaofficial.vercel.app
- Supabase Auth site URL and redirect contract is tracked in `supabase/config.toml`.
- Native callback: `com.zikr.app://auth/callback`

## Post-transfer validation
Run in the new checkout:
```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm check
pnpm project:check
pnpm supabase:migrations:check
pnpm mobile:check
pnpm build
```

Then reconnect:
1. GitHub repository -> Vercel
2. GitHub repository -> CircleCI
3. Supabase project access / deployment credentials
4. OAuth provider redirect URLs
5. Release automation credentials

## Release gate
Source migration readiness does not equal production certification. Fresh Vercel, CircleCI, live Supabase and native release checks must pass after the new GitHub repository is connected.

## Important
Keep the current repository intact until the new repository has been cloned/verified and all external integrations have been re-linked successfully.
