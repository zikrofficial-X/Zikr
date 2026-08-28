'use server';

import { generateText, streamText } from 'ai';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, type GenerationConfig } from '@google/generative-ai';
import { getServerEnv } from '@/lib/env';

/**
 * Gemini client with:
 * 1. Vercel AI Gateway (uses AI_GATEWAY_API_KEY, zero-config for Google models)
 * 2. Direct Google SDK with round-robin key rotation across all 19 keys
 */

// ── AI Gateway ───────────────────────────────────────────────────────────────
function getGatewayModelId(): string {
  const raw = (getServerEnv().GEMINI_MODEL ?? 'gemini-2.5-flash').trim();
  if (raw.includes('/')) return raw;
  if (raw.startsWith('gemini-1.5')) return 'google/gemini-2.5-flash';
  return `google/${raw}`;
}

function gatewayAvailable(): boolean {
  return Boolean(
    (process.env.AI_GATEWAY_API_KEY?.trim()) ||
    (process.env.VERCEL_OIDC_TOKEN?.trim())
  );
}

// ── Direct SDK with key rotation ─────────────────────────────────────────────
// Discover every available Gemini key once: GEMINI_API_KEY plus GEMINI_API_KEY_1..30.
// The project provides GEMINI_API_KEY_2 .. GEMINI_API_KEY_19, but this also picks
// up a plain GEMINI_API_KEY or GEMINI_API_KEY_1 if they are ever added.
let cachedKeys: string[] | null = null;
let keyIndex = 0;

function getAvailableKeys(): string[] {
  if (cachedKeys) return cachedKeys;
  const keys: string[] = [];
  // Resolved primary key (handles bare name or numbered-suffix provisioning)
  const primary = getServerEnv().GEMINI_API_KEY?.trim();
  if (primary) keys.push(primary);
  const plain = process.env.GEMINI_API_KEY?.trim();
  if (plain && !keys.includes(plain)) keys.push(plain);
  for (let i = 1; i <= 30; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`]?.trim();
    if (key && !keys.includes(key)) keys.push(key);
  }
  cachedKeys = keys;
  return keys;
}

function getNextApiKey(): string | null {
  const keys = getAvailableKeys();
  if (keys.length === 0) return null;
  const key = keys[keyIndex % keys.length];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

function getDirectModel(): string {
  return getServerEnv().GEMINI_MODEL?.replace(/^google\//, '') ?? 'gemini-2.5-flash';
}

// BLOCK_ONLY_HIGH exists at runtime but some TS type versions omit it — cast
const BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH' as unknown as HarmBlockThreshold;

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: BLOCK_ONLY_HIGH },
];

const generationConfig: GenerationConfig = {
  temperature: 0.5,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 1500,
};

async function callDirectSdk(prompt: string, maxOutputTokens = 1500): Promise<string | null> {
  // Try up to 3 keys on rate-limit errors
  for (let attempt = 0; attempt < 3; attempt++) {
    const key = getNextApiKey();
    if (!key) break;
    try {
      const client = new GoogleGenerativeAI(key);
      const modelId = getDirectModel();
      const model = client.getGenerativeModel({
        model: modelId,
        safetySettings,
        generationConfig: { ...generationConfig, maxOutputTokens },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Rotate key on rate-limit or quota errors
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        console.error(`[gemini] Key ${attempt + 1} quota exceeded, rotating...`);
        continue;
      }
      console.error('[gemini] Direct SDK error:', msg);
      break;
    }
  }
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function generateGeminiText(prompt: string, maxTokens = 1500): Promise<string | null> {
  // 1. Vercel AI Gateway
  if (gatewayAvailable()) {
    try {
      const { text } = await generateText({
        model: getGatewayModelId(),
        prompt,
        temperature: 0.5,
        maxOutputTokens: maxTokens,
      });
      const trimmed = text?.trim();
      if (trimmed) return trimmed;
    } catch (err) {
      console.error('[gemini] Gateway failed, falling back to direct SDK:', err instanceof Error ? err.message : err);
    }
  }
  // 2. Direct SDK with rotation
  return callDirectSdk(prompt, maxTokens);
}

export async function* streamGeminiText(prompt: string): AsyncGenerator<string, void, unknown> {
  if (gatewayAvailable()) {
    try {
      const result = streamText({
        model: getGatewayModelId(),
        prompt,
        temperature: 0.5,
        maxOutputTokens: 1500,
      });
      for await (const chunk of result.textStream) {
        if (chunk) yield chunk;
      }
      return;
    } catch (err) {
      console.error('[gemini] Gateway stream failed, falling back:', err instanceof Error ? err.message : err);
    }
  }

  const key = getNextApiKey();
  if (!key) return;
  try {
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({
      model: getDirectModel(),
      safetySettings,
      generationConfig,
    });
    const streamResult = await model.generateContentStream(prompt);
    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (err) {
    console.error('[gemini] Direct stream failed:', err instanceof Error ? err.message : err);
  }
}

export async function generateGeminiFromAudio(
  prompt: string,
  audio: { data: string; mimeType: string },
): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const key = getNextApiKey();
    if (!key) break;
    try {
      const client = new GoogleGenerativeAI(key);
      const model = client.getGenerativeModel({
        model: getDirectModel(),
        safetySettings,
        generationConfig: { ...generationConfig, maxOutputTokens: 2000 },
      });
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: audio.data, mimeType: audio.mimeType } },
      ] as never);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        console.error(`[gemini] Audio key ${attempt + 1} quota exceeded, rotating...`);
        continue;
      }
      console.error('[gemini] Audio generation failed:', msg);
      break;
    }
  }
  return null;
}
