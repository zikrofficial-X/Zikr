import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const button = read("src/features/auth/components/google-oauth-button.tsx");
const activity = read("android/app/src/main/java/com/zikr/app/MainActivity.java");
const pkg = JSON.parse(read("package.json"));
const lock = read("pnpm-lock.yaml");
const proxy = read("proxy.ts");

assert.ok(pkg.dependencies?.["@capgo/capacitor-social-login"], "Capgo Social Login dependency is required");
assert.ok(lock.includes("@capgo/capacitor-social-login@7.20.0"), "pnpm lockfile must include the resolved native plugin");
assert.ok(button.includes('Capacitor.getPlatform() === "android"'), "Android must have a dedicated native login branch");
assert.ok(button.includes("SocialLogin.initialize("), "Native Google plugin must be initialized");
assert.ok(button.includes("SocialLogin.login("), "Native Google Credential Manager must be invoked");
assert.ok(button.includes("supabase.auth.signInWithIdToken("), "Google ID token must be exchanged with Supabase");
assert.ok(button.includes("NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID"), "Native login must use the Web OAuth client ID");
assert.ok(button.includes("window.location.replace(safeNext)"), "Native success must return to the in-app route");
assert.ok(button.indexOf('if (isAndroidNative)') < button.indexOf("Browser.open({ url: data.url })"), "Android native flow must return before Browser.open");
assert.ok(activity.includes("ModifiedMainActivityForSocialLoginPlugin"), "MainActivity must implement the required plugin marker interface");
assert.ok(activity.includes("handleGoogleLoginIntent"), "MainActivity must forward Google activity results");
assert.ok(proxy.includes('request.headers.get("host")'), "Canonical-host logic must inspect the incoming Host header");
assert.ok(proxy.includes('process.env.VERCEL_ENV === "production"'), "Preview deployments must not be redirected to production");
assert.ok(proxy.includes("PRODUCTION_URL"), "Production canonical host must come from the single source of truth");

console.log("Native Google OAuth and canonical-host contracts passed.");
