# Security Policy

## Reporting a vulnerability

Please do not report security vulnerabilities in public issues. Contact the repository owner through the private security reporting channel available in GitHub, or through the contact details published on the official ZIKR website.

When reporting an issue, include the affected URL or component, reproduction steps, impact, and a minimal proof of concept. Do not include passwords, access tokens, service-role keys, release keystores, or personal user data.

## Credential exposure

If a credential may have been exposed, revoke or rotate it immediately in its owning provider, then report the incident privately. Removing a value from the current branch is not sufficient if it existed in Git history.

## Supported versions

The supported version is the latest production release on the protected `main` branch and the latest tagged Android release. Development branches and unofficial APK copies are not supported distribution channels.

## Security principles

ZIKR keeps service-role credentials, release signing material, and administrative operations server-side. Public client configuration is not treated as authorization. Supabase RLS, server-side authorization, protected branches, CI checks, dependency review, and signed releases are required controls.

No distributed APK can be made mathematically impossible to copy or reverse engineer. Security decisions therefore protect the backend, accounts, data, release identity, and deployment pipeline even if a user has a copy of the application.
