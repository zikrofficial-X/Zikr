# ZIKR Controlled Release

## Development policy

ZIKR does not use Vercel Git integration as the production deployment loop.

- Pull requests and main run the GitHub quality gate.
- GitHub Actions also runs the read-only Supabase Production Health gate against the live production project.
- The canonical command is `pnpm verify`.
- Routine CircleCI source verification and background runs are disabled to avoid duplicate plan usage; CircleCI remains for Android build/signing after the Admin Release service creates the semantic release tag, plus explicitly enabled recovery/release pipelines.
- `vercel.json` disables automatic Git deployments.
- No feature-branch or ordinary main push is expected to create a Vercel production deployment.
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
8. The release workflow re-runs `pnpm verify:pr` on the exact release commit before Vercel deployment.
9. Vercel deploys the prebuilt artifact once.
10. Verify the resulting production deployment is READY and points to the exact release commit.

## Required GitHub Actions secrets

The release workflow requires:

- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID

These are CI secrets and must never be committed to the repository.

## Current production identity (verified 2026-10-21)

- GitHub repository: `zikrofficial-X/Zikr`
- Vercel project: `zikr`
- Vercel project ID: `prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs`
- Vercel team slug/name: `zikr3` / `zikr`
- Vercel team ID: `team_RxPjmgZoSFmKGjScefYmwIVv`
- Supabase project name: `Zikrmediaofficial-X`
- Supabase project ref: `zqtssvlvmkzeeyqghqfk`
- Production domain: `https://zikrmediaofficial.vercel.app`

The Vercel project is linked to the GitHub repository above, and the Supabase project ref is the active project used by the production-health workflow. Treat these identities as the current release targets; re-verify them through the connected provider contexts before changing deployment secrets. Never commit `VERCEL_TOKEN`, database passwords, or Supabase service-role keys.

## Important

The current GitHub connector does not expose branch-protection or ruleset write operations. The quality workflow is implemented, but whether its checks are formally required for merging must be verified in GitHub Repository Settings; configure required status checks there before treating the gate as mandatory.


## Cryptographically signed Git tags

GitHub REST's annotated-tag creation endpoint does not accept a detached or embedded signing signature. The release manager must not claim that an API-created annotated tag is signed.

For each future semantic release:
1. Prepare all release metadata in one atomic source commit.
2. In a protected signing runner, import the owner-managed GPG or SSH private signing key from a CI secret.
3. Create the annotated tag with `git tag -s` (GPG) or the configured SSH signing mode, targeting the exact prepared commit.
4. Run `git verify-tag` and require a valid signature from the expected signing key/fingerprint.
5. Push the signed tag and verify GitHub's tag object reports a valid signature before creating/publishing the release.
6. Only then publish the immutable release and artifacts.

The signing key must be provisioned by the repository owner as a protected CI secret. The release must fail closed if the key is missing, invalid, expired, or does not match the trusted fingerprint. Never delete or move an existing immutable release tag to retrofit a signature.
