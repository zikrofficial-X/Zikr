import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(
  "src/components/layout/native-google-oauth-handler.tsx",
  "utf8",
);

describe("native Google OAuth handler", () => {
  it("requires the exact Android app callback pathname", () => {
    assert.ok(source.includes('url.pathname === "/callback"'));
    assert.ok(!source.includes('url.pathname.startsWith("/callback")'));
  });

  it("uses a generic callback error for unexpected runtime exceptions", () => {
    assert.ok(
      source.includes(
        'window.location.replace(loginUrl("auth_callback_failed", nextPath))',
      ),
    );
    assert.ok(
      !source.includes(
        'oauthErrorDescription ? "google_oauth_failed" : "auth_callback_failed"',
      ),
    );
  });
});
