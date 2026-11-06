# GA4 Read-only Reporting Setup

The Admin Analytics dashboard reads Google Analytics 4 reports through the Google Analytics Data API. It does not use the public measurement ID as a reporting credential.

## Required Vercel environment variables

- `GOOGLE_CLIENT_ID`: existing Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: existing Google OAuth client secret.
- `GA4_PROPERTY_ID`: numeric GA4 property ID (not the measurement ID beginning with `G-`).
- `GA4_REFRESH_TOKEN`: dedicated OAuth refresh token granted the scope `https://www.googleapis.com/auth/analytics.readonly`.

## Google setup

1. Enable **Google Analytics Data API** in the Google Cloud project used by the OAuth client.
2. Grant the Google account used for OAuth at least Viewer access to the required GA4 property.
3. Run the Google OAuth authorization-code flow with the scope `https://www.googleapis.com/auth/analytics.readonly`, offline access, and consent so a refresh token is issued.
4. Store only the refresh token in Vercel as `GA4_REFRESH_TOKEN`; never place it in a public `NEXT_PUBLIC_*` variable or the repository.
5. Set the numeric property ID as `GA4_PROPERTY_ID` and redeploy so the server picks up the new environment.

The dashboard reports 28 completed days of active users, sessions, page views, engagement rate, events, key events, session channel groups, and landing pages. It caches successful/authorization results for up to one hour and never exposes OAuth tokens.

A measurement ID alone only enables website event collection; it does not grant permission to read GA4 reporting data. A missing property ID or refresh token appears as **not connected**, and a rejected token or missing scope appears as **authorization required**.
