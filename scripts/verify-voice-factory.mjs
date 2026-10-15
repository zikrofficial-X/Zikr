#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) { failures.push(`missing required Voice Factory file: ${path}`); return ""; }
  return readFileSync(path, "utf8");
};

const tts = read("scripts/generate-arabic-voice.py");
if (!tts.includes("edge_tts.Communicate")) failures.push("Arabic voice generator must use real Edge TTS synthesis");
if (!tts.includes("clean_text(text)")) failures.push("Arabic TTS must pass text through the canonical sanitizer");
if (!tts.includes("text[:5000]")) failures.push("Arabic TTS must enforce the 5000-character input cap");
if (!tts.includes('"hadith": {"voice": "ar-SA-HamedNeural"')) failures.push("Hadith Arabic TTS profile must use a male MSA voice");
if (!tts.includes('"rate": "-10%"')) failures.push("Hadith/default Arabic voice rate must be human-like and configurable");
if (!tts.includes("output.stat().st_size < 1024")) failures.push("Arabic TTS must reject empty/tiny outputs");
for (const token of ["ARABIC_TTS_VOICE", "ARABIC_TTS_RATE", "ARABIC_TTS_PITCH"]) if (!tts.includes(token)) failures.push(`Arabic TTS configuration missing: ${token}`);

const worker = read("scripts/jobs/template-video-automation.ts");
if (!worker.includes("scripts/generate-arabic-voice.py")) failures.push("production video worker must use the canonical Arabic TTS helper");
if (!worker.includes("getDefaultVideoVoiceProfile")) failures.push("production video worker must resolve canonical voice profiles");
if (!worker.includes("ARABIC_TTS_VOICE")) failures.push("production video worker must expose the canonical TTS voice setting");
if (!worker.includes('category === "quran" && !audioUrl')) failures.push("Quran videos must reject missing verified recitation rather than falling back to TTS");
if (!worker.includes("Rendered output has no narration/audio stream.")) failures.push("production worker must reject silent renders");

const runner = read("scripts/run-background-jobs.ts");
if (!runner.includes('EDGE_TTS_VERSION = "7.3.1"')) failures.push("background runner must pin edge-tts 7.3.1");
if (!runner.includes("edge-tts==${EDGE_TTS_VERSION}")) failures.push("background runner must install the pinned Edge TTS version");
if (!runner.includes("ensureArabicTtsRuntime()")) failures.push("background runner must verify/bootstrap the TTS runtime");

const workflow = read(".github/workflows/generate-ai-video.yml");
if (!workflow.includes('cron: "17 3,9,15,21 * * *"')) failures.push("GitHub video workflow must own the production schedule");
if (!workflow.includes("edge-tts==7.3.1")) failures.push("GitHub video workflow must pin edge-tts 7.3.1");

const circle = read(".circleci/config.yml");
if (circle.includes("edge-tts==7.3.1")) failures.push("CircleCI must not carry the production video TTS runtime after the ownership split");

if (existsSync("scripts/jobs/free-tier-video-narration.ts")) failures.push("legacy free-tier narration script must be removed from the runtime tree");

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts["voice:factory:check"]) failures.push("voice:factory:check must be registered");
if (!packageJson.scripts["verify:pr"]?.includes("pnpm voice:factory:check")) failures.push("verify:pr must include Voice Factory verification");
if (!packageJson.scripts["verify"]?.includes("pnpm voice:factory:check")) failures.push("verify must include Voice Factory verification");
if (!existsSync("src/features/videos/services/voice-profiles.ts")) failures.push("canonical voice profile service is missing");
if (!existsSync("src/features/videos/services/narration-quality.ts")) failures.push("Arabic narration quality validator is missing");

if (failures.length) {
  console.error("VOICE_FACTORY_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}
console.log("✅ Phase 9 Voice Factory checks passed");
