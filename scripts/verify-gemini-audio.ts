import { GoogleGenerativeAI } from "@google/generative-ai";

function makeWav(seconds = 1, sampleRate = 16_000): Buffer {
  const samples = Math.floor(seconds * sampleRate);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples; i += 1) {
    const value = Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 1200);
    buffer.writeInt16LE(value, 44 + i * 2);
  }
  return buffer;
}

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

const configured = (process.env.GEMINI_MODEL || "gemini-3.1-flash-lite").trim();
const models = [...new Set([configured, "gemini-3.5-flash-lite"])];
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

let lastError: unknown = null;

for (const modelId of models) {
  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: modelId,
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 160,
        responseMimeType: "application/json",
      },
    });

    const response = await model.generateContent([
      prompt,
      { inlineData: { data: audio.toString("base64"), mimeType: "audio/wav" } },
    ] as never);

    const raw = response.response.text().trim();
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (parsed.ok !== true || typeof parsed.audioQuality !== "string" || typeof parsed.summary !== "string") {
      throw new Error(`Invalid Gemini audio JSON contract from ${modelId}: ${raw.slice(0, 500)}`);
    }

    console.log(`Gemini audio smoke test: OK (${modelId})`);
    console.log(JSON.stringify({
      ok: parsed.ok,
      model: modelId,
      audioQuality: parsed.audioQuality,
      summary: parsed.summary,
    }, null, 2));
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(`Gemini audio smoke test failed on ${modelId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

throw new Error(`Gemini audio smoke test failed across free models: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
