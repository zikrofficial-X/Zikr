import "server-only";

import { generateText, streamText } from 'ai';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, type GenerationConfig } from '@google/generative-ai';
import { getServerEnv } from '@/lib/env';

/**
 * Gemini client with:
 * 1. Vercel AI Gateway (uses AI_GATEWAY_API_KEY, zero-config for Google models)
 * 2. Direct Google SDK with key rotation across all configured keys
 */

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

let cachedKeys: string[] | null = null;
let keyIndex = 0;

function getAvailableKeys(): string[] {
  if (cachedKeys) return cachedKeys;
  const keys: string[] = [];
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

const BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH' as unknown as HarmBlockThreshold;

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: BLOCK_ONLY_HIGH },
];

const generationConfig: GenerationConfig = {
  temperature: 0.5,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 1500,
};

function isTransientGeminiError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const normalized = msg.toLowerCase();
  return (
    normalized.includes('429') ||
    normalized.includes('quota') ||
    normalized.includes('resource_exhausted') ||
    normalized.includes('503') ||
    normalized.includes('unavailable') ||
    normalized.includes('high demand') ||
    normalized.includes('temporarily unavailable')
  );
}

async function backoff(attempt: number): Promise<void> {
  const jitter = Math.floor(Math.random() * 150);
  await new Promise(resolve => setTimeout(resolve, 350 * attempt + jitter));
}

async function callDirectSdk(prompt: string, maxOutputTokens = 1500): Promise<string | null> {
  const keys = getAvailableKeys();
  if (keys.length === 0) return null;

  const attempts = Math.min(Math.max(keys.length, 3), 6);
  for (let attempt = 0; attempt < attempts; attempt++) {
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
      if (isTransientGeminiError(err)) {
        console.warn(`[gemini] transient upstream failure on rotated key ${attempt + 1}; retrying`);
        await backoff(attempt + 1);
        continue;
      }
      console.error('[gemini] Direct SDK error:', err instanceof Error ? err.message : err);
      break;
    }
  }
  return null;
}

export async function generateGeminiText(prompt: string, maxTokens = 1500): Promise<string | null> {
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
      console.warn('[gemini] Gateway failed, falling back to direct SDK:', err instanceof Error ? err.message : err);
    }
  }
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
      console.warn('[gemini] Gateway stream failed, falling back:', err instanceof Error ? err.message : err);
    }
  }

  const keys = getAvailableKeys();
  const attempts = Math.min(Math.max(keys.length, 3), 6);
  for (let attempt = 0; attempt < attempts; attempt++) {
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
      return;
    } catch (err) {
      if (isTransientGeminiError(err)) {
        console.warn(`[gemini] transient stream failure on rotated key ${attempt + 1}; retrying`);
        await backoff(attempt + 1);
        continue;
      }
      console.error('[gemini] Direct stream failed:', err instanceof Error ? err.message : err);
      return;
    }
  }
}

export async function generateGeminiFromAudio(
  prompt: string,
  audio: { data: string; mimeType: string },
): Promise<string | null> {
  const keys = getAvailableKeys();
  const attempts = Math.min(Math.max(keys.length, 3), 6);
  for (let attempt = 0; attempt < attempts; attempt++) {
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
      if (isTransientGeminiError(err)) {
        console.warn(`[gemini] transient audio failure on rotated key ${attempt + 1}; retrying`);
        await backoff(attempt + 1);
        continue;
      }
      console.error('[gemini] Audio generation failed:', err instanceof Error ? err.message : err);
      break;
    }
  }
  return null;
}
