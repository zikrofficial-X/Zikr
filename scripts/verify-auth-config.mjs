#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";

const failures = [];
const read = (file) => (existsSync(file) ? readFileSync(file, "utf8") : "");

const config = read("supabase/config.toml");
const env = read(".env.example");
const enhanced = read("src/lib/auth-enhanced.ts");
const callback = read("src/app/auth/callback/route.ts");
const googleRoute = read("src/features/auth/integrations/google-oauth.ts");
const proxy = read("proxy.ts");
const button = read("src/features/auth/components/google-oauth-button.tsx");
const native = read("src/components/layout/native-google-oauth-handler.tsx");

const production = "https://zikrmediaofficial.vercel.app";
const supabaseProvider = "https://eydxvcamhjhajxjrsgym.supabase.co/auth/v1/callback";
const nativeCallback = "com.zikr.app://auth/callback";

function requireText(label, source, token) {
  if (!source.includes(token)) failures.push(label + ": missing " + token);
}

const expectedRedirects = [
  nativeCallback,
  "http://localhost:3000/**",
  production + "/auth/callback",
];

const authBlockMatch = config.match(/\[auth\]([\s\S]*?)(?=\n\[|$)/);
const authBlock = authBlockMatch ? authBlockMatch[0] : "";
const siteUrlMatch = authBlock.match(/^site_url\s*=\s*"([^"]+)"/m);
const redirectsMatch = authBlock.match(/additional_redirect_urls\s*=\s*\[([\s\S]*?)\]/m);
const configuredRedirects = redirectsMatch
  ? Array.from(redirectsMatch[1].matchAll(/"([^"]+)"/g), match => match[1])
  : [];

if (siteUrlMatch?.[1] !== production) {
  failures.push("supabase/config.toml: site_url is not the locked canonical production URL");
}
if (JSON.stringify(configuredRedirects) !== JSON.stringify(expectedRedirects)) {
  failures.push(
    "supabase/config.toml: additional_redirect_urls must exactly match the three approved production/native/local entries",
  );
}
if (authBlock.includes('site_url = "' + production + '"') && !authBlock.includes('site_url = "' + production + '/"')) {
  failures.push("supabase/config.toml: trailing slash was removed from the canonical Site URL");
}

requireText(".env.example", env, "AUTH_CALLBACK_URL=" + production + "/auth/callback");
requireText("auth-enhanced", enhanced, 'new URL("/auth/callback"');
requireText("browser Google button", button, "provider: \"google\"");
requireText("browser Google button", button, "redirectTo");
requireText("native Google handler", native, 'url.pathname === "/callback"');
requireText("callback route", callback, "exchangeCodeForSession");
requireText("callback route", callback, "extractNextPath");
requireText("callback route", callback, "getTrustedAuthOrigin");
requireText("Google route", googleRoute, "getCanonicalAuthBaseUrl");
requireText("proxy", proxy, "getCanonicalAuthBaseUrl");

if (config.includes(supabaseProvider)) {
  failures.push("supabase/config.toml: provider callback must not be placed in the application redirect allowlist as AUTH_CALLBACK_URL");
}

if (/google\.(?:oauth2|provider).*vercelmedia/i.test(config)) {
  failures.push("supabase/config.toml: unexpected hard-coded Google provider credential reference");
}

const nativeDirect = native.includes('url.protocol === "com.zikr.app:"') && native.includes('url.hostname === "auth"');
if (!nativeDirect) failures.push("native Google handler: exact com.zikr.app://auth/callback validation is incomplete");

const callbackHost = callback.match(/new URL\('\/auth\/login', origin\)/);
if (!callbackHost) failures.push("callback route: error redirects must stay on trusted auth origin");

if (failures.length) {
  console.error("AUTH_CONFIG_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}

console.log("✅ Google/Supabase Auth configuration check passed");
