# ZIKR Source of Truth

## Canonical source

The canonical application source for ZIKR is:

- GitHub repository: `Zikrmediaofficial/Zikr`
- Production branch: `main`
- Vercel project: `zikr`
- Vercel project: `zikr`
- Production domain: `https://zikrmediaofficial.vercel.app`

## Deployment rule

Vercel production must build from the GitHub `main` branch. The repository is the authoritative source; local ZIP exports, downloaded copies, and old deployment artifacts are archives only and must never be treated as a competing source of truth.

## Current verified state

Repository `main` currently points to:

`4579077d73652992b3955102522f77bbc7640d1e`

The current repair commits are not yet represented by a newer READY Vercel production deployment because Vercel is currently returning a deployment rate-limit condition. The repository must therefore remain the canonical source until a fresh production deployment is successfully built and verified against the intended commit.

## Runtime baseline

The repository declares Node.js `22.x`. Vercel is also configured for Node.js `22.x`.

## Important distinction

An uploaded or exported ZIP may contain an older snapshot of the project. It must not be pushed back over `main` merely to make the ZIP match the repository. When a ZIP and the repository disagree, compare them first and preserve the newer canonical repository state.

## Change workflow

1. Make application changes in the GitHub repository.
2. Commit to `main` directly only for verified production-safe changes; otherwise use a feature branch and PR.
3. Let the linked Vercel project deploy from GitHub.
4. Verify the resulting production deployment commit SHA matches the intended GitHub commit.
5. Treat old Vercel deployments and ZIP exports as historical artifacts, not sources.

## Do not do

- Do not reconnect ZIKR to a different GitHub repository.
- Do not deploy the stale ZIP over the current `main` branch.
- Do not use an old Vercel deployment as the new source.
- Do not maintain separate production codebases for GitHub and Vercel.
