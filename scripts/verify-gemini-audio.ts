import { generateGeminiFromAudio } from "../src/features/spiritual-ai/services/gemini-client";

function makeWav(seconds = 1, sampleRate = 16_000): Buffer {
  const samples = Math.floor(seconds * sampleRate);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Low-volume non-speech tone. This is a transport test, not a recitation sample.
  for (let i = 0; i < samples; i += 1) {
    const value = Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 1200);
    buffer.writeInt16LE(value, 44 + i * 2);
  }
  return buffer;
}

const audio = makeWav();
const prompt = [
  "This is a production plumbing smoke test for ZIKR's memorization audio path.",
  "The attached audio is a synthetic non-speech tone and contains no Quran recitation.",
  "Do not invent words, verses, tajweed findings, or a memorization score.",
  "Return JSON only with exactly these keys:",
  '{"ok":true,"audioQuality":"","summary":""}',
  "Set ok=true only when the model can analyze the audio input and return a valid response.",
  "State explicitly that the sample is not intelligible speech.",
].join("\n");

const raw = await generateGeminiFromAudio(prompt, {
  data: audio.toString("base64"),
  mimeType: "audio/wav",
});

if (!raw) {
  throw new Error("Gemini audio smoke test returned no response.");
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch {
  throw new Error(`Gemini audio smoke test returned non-JSON output: ${raw.slice(0, 500)}`);
}

if (!parsed || typeof parsed !== "object") {
  throw new Error("Gemini audio smoke test returned an invalid JSON object.");
}

const value = parsed as Record<string, unknown>;
if (value.ok !== true || typeof value.audioQuality !== "string" || typeof value.summary !== "string") {
  throw new Error("Gemini audio smoke test JSON contract is invalid.");
}

console.log("Gemini audio smoke test: OK");
console.log(JSON.stringify({
  ok: value.ok,
  audioQuality: value.audioQuality,
  summary: value.summary,
}, null, 2));
