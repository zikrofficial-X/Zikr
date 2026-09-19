#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";

const failures = [];
const read = (file) => (existsSync(file) ? readFileSync(file, "utf8") : "");

const config = read("supabase/config.toml");
const env = read(".env.example");
const enhanced = read("src/lib/auth-enhanced.ts");
const callback = read("src/app/auth/callback/route.ts");
const button = read("src/features/auth/components/google-oauth-button.tsx");
const native = read("src/components/layout/native-google-oauth-handler.tsx");

const production = "https://zikrmediaofficial.vercel.app";
const supabaseProvider = "https://eydxvcamhjhajxjrsgym.supabase.co/auth/v1/callback";
const nativeCallback = "com.zikr.app://auth/callback";

function requireText(label, source, token) {
  if (!source.includes(token)) failures.push(label + ": missing " + token);
}

requireText("supabase/config.toml", config, 'site_url = "' + production + '"');
requireText("supabase/config.toml", config, '"' + production + '/auth/callback"');
requireText("supabase/config.toml", config, '"http://localhost:3000/auth/callback"');
requireText("supabase/config.toml", config, '"' + nativeCallback + '"');

requireText(".env.example", env, "AUTH_CALLBACK_URL=" + production + "/auth/callback");
requireText("auth-enhanced", enhanced, 'new URL("/auth/callback"');
requireText("browser Google button", button, "provider: \"google\"");
requireText("browser Google button", button, "redirectTo");
requireText("native Google handler", native, 'url.pathname === "/callback"');
requireText("callback route", callback, "exchangeCodeForSession");
requireText("callback route", callback, "extractNextPath");
requireText("callback route", callback, "getTrustedAuthOrigin");

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
