# ZIKR Controlled Release

## Development policy

ZIKR does not use Vercel Git integration as the development deployment loop.

- Pull requests and main run the GitHub quality gate.
- The canonical command is pnpm verify.
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
