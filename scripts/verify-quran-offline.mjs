#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const requiredFiles = [
  "src/features/quran/services/offline-audio.ts",
  "src/features/notifications/services/quran-reminder.ts",
  "src/features/profile/components/profile-local-settings.tsx",
  "supabase/migrations/20261002171223_offline_quran_profile_daily_reminders.sql",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required file: ${file}`);
}

const offlineAudio = readFile("src/features/quran/services/offline-audio.ts");
if (offlineAudio.includes("from(\"storage\")") || offlineAudio.includes("Supabase Storage")) {
  failures.push("offline Quran audio manager must not use Supabase Storage");
}
for (const token of [
  "caches.open",
  "downloadQuranAudio",
  "removeQuranAudio",
  "resolveQuranAudio",
]) {
  if (!offlineAudio.includes(token)) failures.push(`offline audio manager missing ${token}`);
}

const bridge = readFile("src/components/layout/native-capacitor-bridge.tsx");
for (const token of ["downloadFile", "deleteFile", "getFileUrl", "convertFileSrc"]) {
  if (!bridge.includes(token)) failures.push(`native bridge missing ${token}`);
}

const profile = readFile("src/features/profile/services/profile.ts");
for (const token of ["preferred_reciter_code", "daily_wird_target", "timezone", "bio"]) {
  if (!profile.includes(token)) failures.push(`profile persistence missing ${token}`);
}

const reminder = readFile("src/features/reminders/services/reminder-preferences.ts");
for (const token of ["quran_enabled", "quran_time", "quran_message"]) {
  if (!reminder.includes(token)) failures.push(`Quran reminder persistence missing ${token}`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
if (!packageJson.scripts?.["quran:offline:check"]) failures.push("package.json must register quran:offline:check");
if (!packageJson.scripts?.verify?.includes("pnpm quran:offline:check")) failures.push("verify must include quran:offline:check");
if (!packageJson.scripts?.["verify:pr"]?.includes("pnpm quran:offline:check")) failures.push("verify:pr must include quran:offline:check");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Quran offline library verification passed.");
