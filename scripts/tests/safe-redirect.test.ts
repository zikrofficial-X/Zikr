import assert from "node:assert/strict";
import { sanitizeInternalPath } from "../../src/lib/safe-redirect";
import { getCanonicalAuthBaseUrl, getTrustedAuthOrigin } from "../../src/lib/auth-enhanced";
import { PRODUCTION_URL, isV0PreviewHost } from "../../src/lib/site";

assert.equal(sanitizeInternalPath("/profile"), "/profile");
assert.equal(sanitizeInternalPath("/admin?tab=content"), "/admin?tab=content");
assert.equal(sanitizeInternalPath("/kids/story#section"), "/kids/story#section");

for (const candidate of [
  "//attacker.example",
  "///attacker.example",
  "/\\\\attacker.example",
  "/\\attacker.example",
  "https://attacker.example",
  "javascript:alert(1)",
  "/admin\n//attacker.example",
  " /admin",
  "/admin ",
]) {
  assert.equal(sanitizeInternalPath(candidate), "/profile", `unsafe redirect path must be rejected: ${JSON.stringify(candidate)}`);
}

assert.equal(sanitizeInternalPath(null), "/profile");
assert.equal(sanitizeInternalPath({}), "/profile");

const originalRedirect = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL;
const originalNodeEnv = process.env.NODE_ENV;
const originalVercelEnv = process.env.VERCEL_ENV;
const originalPublicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
const originalVercelUrl = process.env.VERCEL_URL;
const originalVercelBranchUrl = process.env.VERCEL_BRANCH_URL;
try {
  process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL = "https://preview.zikr.v0.app/auth/callback";
  process.env.NODE_ENV = "production";
  process.env.VERCEL_ENV = "production";
  assert.equal(
    getCanonicalAuthBaseUrl("http://localhost:3000"),
    PRODUCTION_URL,
    "production registration and auth redirects must not trust a client-supplied localhost Origin",
  );
  process.env.NODE_ENV = "development";
  process.env.VERCEL_ENV = "development";
  assert.equal(
    getCanonicalAuthBaseUrl("http://localhost:3000"),
    "http://localhost:3000",
    "local development must continue to support localhost auth redirects",
  );
  process.env.NODE_ENV = "production";
  process.env.VERCEL_ENV = "preview";
  delete process.env.NEXT_PUBLIC_VERCEL_ENV;
  assert.equal(isV0PreviewHost("preview.zikr.v0.app"), true);
  assert.equal(isV0PreviewHost("attacker.example"), false);
  assert.equal(isV0PreviewHost("sub.preview.zikr.v0.app"), false);

  process.env.VERCEL_ENV = "production";
  assert.equal(isV0PreviewHost("preview.zikr.v0.app"), false);
  process.env.VERCEL_ENV = "preview";
  process.env.VERCEL_URL = "zikr-pr-320-preview.vercel.app";
  process.env.VERCEL_BRANCH_URL = "zikr-git-audit-branch-zikr3.vercel.app";
  assert.equal(getCanonicalAuthBaseUrl("https://zikr-pr-320-preview.vercel.app"), "https://zikr-pr-320-preview.vercel.app", "trusted deployment preview must keep its own PKCE origin");
  assert.equal(getCanonicalAuthBaseUrl("https://zikr-git-audit-branch-zikr3.vercel.app"), "https://zikr-git-audit-branch-zikr3.vercel.app", "trusted branch preview must keep its own PKCE origin");
  assert.equal(getCanonicalAuthBaseUrl("https://attacker.vercel.app"), PRODUCTION_URL, "untrusted Vercel hosts must still canonicalize to production");
  process.env.VERCEL_ENV = "production";
  assert.equal(getCanonicalAuthBaseUrl("https://zikr-pr-320-preview.vercel.app"), PRODUCTION_URL, "production must never preserve a preview origin");
  const spoofedProductionRequest = new Request(`${PRODUCTION_URL}/auth/callback`, {
    headers: {
      "x-forwarded-host": "127.0.0.1:3000",
      "x-forwarded-proto": "http",
    },
  });
  assert.equal(
    getTrustedAuthOrigin(spoofedProductionRequest),
    PRODUCTION_URL,
    "OAuth error redirects must ignore forwarded headers that could target a local service",
  );

  process.env.VERCEL_ENV = "preview";
  const previewRequest = new Request("https://zikr-pr-320-preview.vercel.app/auth/callback", {
    headers: {
      "x-forwarded-host": "attacker.example",
      "x-forwarded-proto": "http",
    },
  });
  assert.equal(
    getTrustedAuthOrigin(previewRequest),
    "https://zikr-pr-320-preview.vercel.app",
    "trusted preview OAuth redirects must use the request origin, not spoofed forwarded headers",
  );
} finally {
  if (originalRedirect === undefined) delete process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL;
  else process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL = originalRedirect;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
  if (originalPublicVercelEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
  else process.env.NEXT_PUBLIC_VERCEL_ENV = originalPublicVercelEnv;
  if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = originalVercelUrl;
  if (originalVercelBranchUrl === undefined) delete process.env.VERCEL_BRANCH_URL;
  else process.env.VERCEL_BRANCH_URL = originalVercelBranchUrl;
}

console.log("Safe auth redirect and preview-origin tests passed.");
