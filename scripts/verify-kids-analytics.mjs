import { readFileSync } from "node:fs";

const helper = readFileSync("src/lib/analytics/kids-events.ts", "utf8");
const shell = readFileSync("src/features/kids/components/games/game-shell.tsx", "utf8");
const envExample = readFileSync(".env.example", "utf8");

if (!helper.includes('process.env.NEXT_PUBLIC_KIDS_ANALYTICS_ENABLED === "true"')) {
  throw new Error("Kids analytics must be explicitly disabled unless a reviewed consent configuration enables it");
}
for (const eventName of ["game_opened", "game_started", "game_completed", "game_replayed"]) {
  if (!helper.includes('"' + eventName + '"') || !shell.includes('"' + eventName + '"')) {
    throw new Error("Kids game lifecycle event is missing: " + eventName);
  }
}
for (const forbidden of ["user_id", "email", "phone", "child_name", "ip_address", "ad_id", "session_id"]) {
  if (helper.toLowerCase().includes(forbidden)) {
    throw new Error("Kids analytics must not transmit personal/device identifiers: " + forbidden);
  }
}
if (!helper.includes('gtag("event", eventName, eventPayload)')) {
  throw new Error("Kids game metrics must use the consent-aware Google tag event path");
}
if (!envExample.includes("NEXT_PUBLIC_KIDS_ANALYTICS_ENABLED=false")) {
  throw new Error("Kids analytics must be disabled in the example deployment environment");
}
for (const token of ["trackKidsGameEvent", "game_opened", "game_started", "game_completed", "game_replayed"]) {
  if (!shell.includes(token)) throw new Error("Kids game shell is missing analytics instrumentation: " + token);
}

console.log("Kids analytics privacy contract passed.");
