import assert from "node:assert/strict";
import { sanitizeInternalPath } from "../../src/lib/safe-redirect";
import { isV0PreviewHost } from "../../src/lib/site";

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
const originalVercelEnv = process.env.VERCEL_ENV;
const originalPublicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
try {
  process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL = "https://preview.zikr.v0.app/auth/callback";
  process.env.VERCEL_ENV = "preview";
  delete process.env.NEXT_PUBLIC_VERCEL_ENV;
  assert.equal(isV0PreviewHost("preview.zikr.v0.app"), true);
  assert.equal(isV0PreviewHost("attacker.example"), false);
  assert.equal(isV0PreviewHost("sub.preview.zikr.v0.app"), false);

  process.env.VERCEL_ENV = "production";
  assert.equal(isV0PreviewHost("preview.zikr.v0.app"), false);
} finally {
  if (originalRedirect === undefined) delete process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL;
  else process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL = originalRedirect;
  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
  if (originalPublicVercelEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
  else process.env.NEXT_PUBLIC_VERCEL_ENV = originalPublicVercelEnv;
}

console.log("Safe auth redirect and preview-origin tests passed.");
