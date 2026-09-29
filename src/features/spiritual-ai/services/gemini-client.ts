import "server-only";

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, type GenerationConfig } from '@google/generative-ai';
import { getServerEnv } from '@/lib/env';

/**
 * Gemini client:
 * Direct Google SDK with key rotation across configured Gemini keys.
 * This keeps the AI path on Google's Gemini API Free Tier instead of routing
 * requests through a separate paid gateway.
 */

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

function getDirectModels(): string[] {
  const configured = (getServerEnv().GEMINI_MODEL?.replace(/^google\//, '') ?? 'gemini-3.1-flash-lite').trim();
  return [...new Set([configured, 'gemini-3.5-flash-lite'])];
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
      for (const modelId of getDirectModels()) {
        try {
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
            console.warn(`[gemini] transient failure on model ${modelId}; trying fallback model/key`);
            continue;
          }
          console.error(`[gemini] Direct SDK error on model ${modelId}:`, err instanceof Error ? err.message : err);
          break;
        }
      }
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
  return callDirectSdk(prompt, maxTokens);
}

export async function* streamGeminiText(prompt: string): AsyncGenerator<string, void, unknown> {
  const keys = getAvailableKeys();
  const attempts = Math.min(Math.max(keys.length, 3), 6);
  for (let attempt = 0; attempt < attempts; attempt++) {
    const key = getNextApiKey();
    if (!key) return;
    try {
      const client = new GoogleGenerativeAI(key);
      const model = client.getGenerativeModel({
        model: getDirectModels()[0],
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
      for (const modelId of getDirectModels()) {
        try {
          const model = client.getGenerativeModel({
            model: modelId,
            safetySettings,
            generationConfig: {
              ...generationConfig,
              maxOutputTokens: 2000,
              responseMimeType: 'application/json',
            } as GenerationConfig,
          });
          const result = await model.generateContent([
            prompt,
            { inlineData: { data: audio.data, mimeType: audio.mimeType } },
          ] as never);
          const text = result.response.text().trim();
          if (text) return text;
        } catch (err: unknown) {
          if (isTransientGeminiError(err)) {
            console.warn(`[gemini] transient audio failure on model ${modelId}; trying fallback model/key`);
            continue;
          }
          console.error(`[gemini] Audio generation failed on model ${modelId}:`, err instanceof Error ? err.message : err);
          break;
        }
      }
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
