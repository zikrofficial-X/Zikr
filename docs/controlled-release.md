# ZIKR Controlled Release

## Development policy

ZIKR does not use Vercel Git integration as the development deployment loop.

- Pull requests and main run the GitHub quality gate.
- GitHub Actions also runs the read-only Supabase Production Health gate against the live production project.
- The canonical command is pnpm verify.
- CircleCI automatic workflows are disabled by default to avoid consuming CircleCI plan credits; CircleCI remains available only when explicitly enabled for a recovery/release pipeline.
- vercel.json disables automatic Git deployments.
- No feature-branch push is expected to create a Vercel deployment.
- Production deployment is performed only by the manual Vercel release workflow.

## Phase release policy

A phase is release-ready only when its branch is complete and the pull request quality gate is green.

1. Finish the phase on its feature branch.
2. Open or update the pull request to main.
3. Wait for ZIKR Quality Gate to pass.
4. Review the final diff, paths, checks, migrations, and phase acceptance criteria.
5. Merge to main.
6. Manually run ZIKR Production Release from main.
7. Enter RELEASE as confirmation and provide the phase or milestone name.
8. The release workflow re-runs pnpm verify on the exact release commit before Vercel deployment.
9. Vercel deploys the prebuilt artifact once.

## Required GitHub Actions secrets

The release workflow requires:

- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID

These are CI secrets and must never be committed to the repository.

## Important

The current GitHub connector does not expose branch-protection or ruleset write operations for this private repository. The quality workflow is implemented, but making its checks formally required for merging must be completed in GitHub Repository Settings once those controls are available.

## Current release mechanics (verified 2026-10-04)

- `vercel.json` sets `git.deploymentEnabled=true`, so pushes to the linked production branch can deploy through the GitHub integration.
- `release-finalization.yml` remains available as an explicit CLI fallback using the current Vercel team `team_z2nBDHi0ppVAXj1cWzs7Qt5c` and project `prj_hRhHT6FUMXshDfzCnIh0aG0wpS1g`; its GitHub Actions `VERCEL_TOKEN` secret must be configured before manually dispatching that fallback.
- Fallback that has worked: create a production deployment from the exact `main` commit through the Vercel API/dashboard (`gitSource`: org `zikr-org`, repo `Zikr`, ref `main`, sha = release commit).
- `release-vercel.yml` (manual, input `RELEASE`) only verifies the live site after a deployment. It has no automatic trigger.
- Quality Gate and Supabase Production Health must be green on the release commit before deploying.
