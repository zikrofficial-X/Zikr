# ZIKR Source of Truth

## Canonical source

The canonical application source for ZIKR is:

- GitHub repository: `zikrcontact-del/Zikr`
- Production branch: `main`
- Vercel project: `zikr`
- Production project ID: `prj_1y2W5TZdugysh25Fgu4VRMDQwPcA`
- Production Vercel team: `team_zifbzhks5C1PW9GXQnQnBU2y`
- Supabase production project: `wvetcauyerlkqvmntajq`
- Production domain: `https://zikrmediaofficial.vercel.app`

## Deployment rule

Vercel Git auto-deployment is disabled. Production releases are performed through the controlled release workflow from the exact `main` commit after the repository verification gate passes.

The repository is the authoritative source; local ZIP exports, downloaded copies, and old deployment artifacts are archives only and must never be treated as a competing source of truth.

## Current verified state

The current repository `main` commit is the authoritative release source. A fresh successful production deployment must be verified against the exact Git commit before treating deployment as release evidence.

## Runtime baseline

The repository declares Node.js `22.x`. Vercel uses Node.js `22.x` through the repository engine constraint.

## Important distinction

An uploaded or exported ZIP may contain an older snapshot of the project. It must not be pushed back over `main` merely to make the ZIP match the repository. When a ZIP and the repository disagree, compare them first and preserve the newer canonical repository state.

## Change workflow

1. Make application changes in the GitHub repository.
2. Commit to a feature branch and PR for non-trivial changes.
3. Merge only after the quality/verification gate passes.
4. Run the controlled production release workflow from `main` with explicit RELEASE confirmation.
5. Verify the resulting production deployment commit SHA matches the intended GitHub commit.
6. Treat old Vercel deployments and ZIP exports as historical artifacts, not sources.

## Do not do

- Do not reconnect ZIKR to a different GitHub repository.
- Do not deploy the stale ZIP over the current `main` branch.
- Do not use an old Vercel deployment as the new source.
- Do not maintain separate production codebases for GitHub and Vercel.
- Do not hard-code obsolete Vercel or Supabase project IDs in release/configuration files.
