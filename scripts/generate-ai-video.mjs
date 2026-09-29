import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const outDir = process.env.VIDEO_OUTPUT_DIR || 'generated-video';
const title = process.env.VIDEO_TITLE || 'آية اليوم';
const language = process.env.VIDEO_LANGUAGE || 'ar';
const duration = Number(process.env.VIDEO_SECONDS || 12);
const geminiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

const fallbackScenes = [
  { heading: 'ذِكرٌ', body: 'وَاذْكُرْ رَبَّكَ إِذَا نَسِيتَ', footer: 'لحظة هدوء • تلاوة • تدبر' },
  { heading: 'تدبّر', body: 'اجعل لسانك رطبًا بذكر الله', footer: 'ZIKR | ذِكرٌ' },
  { heading: 'دعاء', body: 'اللهم أعنّا على ذكرك وشكرك وحسن عبادتك', footer: 'شارك الخير' },
];

function cleanText(value, fallback) {
  return String(value ?? fallback).replace(/[<>]/g, '').trim().slice(0, 180) || fallback;
}

async function askGemini() {
  if (!geminiKey) return fallbackScenes;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`;
  const prompt = `Create exactly 3 short scenes for a premium Islamic reminder video. Topic: ${title}. Language: ${language}. Return JSON only as an array of objects with keys heading, body, footer. Do not invent Quran or hadith citations; use general reminders unless a source is supplied. Keep each body under 90 characters.`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, responseMimeType: 'application/json' } }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const payload = await response.json();
  const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, ''));
  if (!Array.isArray(parsed) || parsed.length < 3) throw new Error('Gemini returned an invalid scene list');
  return parsed.slice(0, 3).map((scene, index) => ({
    heading: cleanText(scene.heading, fallbackScenes[index].heading),
    body: cleanText(scene.body, fallbackScenes[index].body),
    footer: cleanText(scene.footer, fallbackScenes[index].footer),
  }));
}

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function svgForScene(scene, index) {
  const safe = (value) => escapeXml(value);
  const accent = ['#d7b56d', '#9cc9a5', '#d9c28c'][index % 3];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#05070d"/><stop offset="0.52" stop-color="#0b1720"/><stop offset="1" stop-color="#10271f"/></linearGradient><radialGradient id="glow"><stop stop-color="${accent}" stop-opacity=".32"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>
  <rect width="1080" height="1920" fill="url(#bg)"/><circle cx="860" cy="250" r="520" fill="url(#glow)"/><circle cx="130" cy="1750" r="420" fill="url(#glow)" opacity=".5"/>
  <path d="M120 290h840M120 1630h840" stroke="${accent}" stroke-opacity=".35"/><text x="540" y="420" fill="${accent}" font-size="42" text-anchor="middle" font-family="Noto Sans Arabic, sans-serif" letter-spacing="4">${safe(scene.heading)}</text>
  <text x="540" y="900" fill="#f8f3e7" font-size="68" text-anchor="middle" font-family="Noto Naskh Arabic, Noto Sans Arabic, sans-serif" direction="rtl">${safe(scene.body)}</text>
  <text x="540" y="1530" fill="#d6d9d2" font-size="30" text-anchor="middle" font-family="Noto Sans Arabic, sans-serif">${safe(scene.footer)}</text>
  <text x="540" y="1770" fill="#9ea89f" font-size="24" text-anchor="middle" font-family="Arial, sans-serif">ZIKR | ذِكرٌ</text>
</svg>`;
}

await mkdir(outDir, { recursive: true });
let scenes = fallbackScenes;
let mode = 'fallback';
try {
  scenes = await askGemini();
  mode = geminiKey ? 'gemini-free-tier' : 'fallback';
} catch (error) {
  console.warn(`[ai-video] Gemini unavailable; using safe fallback: ${error.message}`);
}

const sceneSeconds = Math.max(3, Math.round(duration / scenes.length));
const concatLines = [];
for (let index = 0; index < scenes.length; index += 1) {
  const svgPath = join(outDir, `scene-${index + 1}.svg`);
  const pngPath = join(outDir, `scene-${index + 1}.png`);
  await writeFile(svgPath, svgForScene(scenes[index], index));
  await exec('rsvg-convert', ['-w', '1080', '-h', '1920', svgPath, '-o', pngPath]);
  concatLines.push(`file '${resolve(pngPath).replaceAll("'", "'\\''")}'`);
  concatLines.push(`duration ${sceneSeconds}`);
}
const lastPng = resolve(outDir, `scene-${scenes.length}.png`);
concatLines.push(`file '${lastPng.replaceAll("'", "'\\''")}'`);
const concatPath = join(outDir, 'concat.txt');
await writeFile(concatPath, `${concatLines.join('\n')}\n`);
const outputPath = join(outDir, 'zikr-ai-reminder.mp4');
await exec('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatPath, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-t', String(sceneSeconds * scenes.length), '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-shortest', outputPath]);
await writeFile(join(outDir, 'metadata.json'), JSON.stringify({ title, mode, duration: sceneSeconds * scenes.length, scenes, generatedAt: new Date().toISOString() }, null, 2));
console.log(`[ai-video] Created ${outputPath} using ${mode}`);
