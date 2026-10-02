"use client";

export type QuranAudioDownload = {
  key: string;
  surahId: number;
  reciterCode: string;
  sourceUrl: string;
  storage: "native" | "cache";
  path?: string;
  uri?: string;
  sizeBytes?: number;
  downloadedAt: string;
};

const CACHE_NAME = "zikr-quran-audio-v1";
const INDEX_KEY = "zikr:quran-audio-downloads";

function recordKey(surahId: number, reciterCode: string): string {
  return `${reciterCode}:${surahId}`;
}

function readIndex(): Record<string, QuranAudioDownload> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, QuranAudioDownload>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeIndex(index: Record<string, QuranAudioDownload>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

type NativeBridge = {
  isNative?: boolean;
  downloadFile?: (url: string, path: string) => Promise<{ path?: string; uri?: string }>;
  deleteFile?: (path: string) => Promise<void>;
  getFileUrl?: (path: string) => Promise<string | null>;
};

function nativeBridge(): NativeBridge | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { zikrNative?: NativeBridge }).zikrNative ?? null;
}

export async function isQuranAudioDownloaded(
  surahId: number,
  reciterCode: string,
): Promise<boolean> {
  const record = readIndex()[recordKey(surahId, reciterCode)];
  if (!record) return false;

  if (record.storage === "native") {
    return Boolean(record.path || record.uri);
  }

  if (!("caches" in window)) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    return Boolean(await cache.match(record.sourceUrl));
  } catch {
    return false;
  }
}

export async function resolveQuranAudio(
  surahId: number,
  reciterCode: string,
): Promise<{ url: string; revoke: boolean } | null> {
  const record = readIndex()[recordKey(surahId, reciterCode)];
  if (!record) return null;

  if (record.storage === "native") {
    const bridge = nativeBridge();
    const path = record.path || record.uri;
    if (!bridge?.getFileUrl || !path) return null;
    const url = await bridge.getFileUrl(path);
    return url ? { url, revoke: false } : null;
  }

  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(record.sourceUrl);
    if (!response) return null;
    const blob = await response.blob();
    return { url: URL.createObjectURL(blob), revoke: true };
  } catch {
    return null;
  }
}

export async function downloadQuranAudio(
  sourceUrl: string,
  surahId: number,
  reciterCode: string,
  onProgress?: (percent: number | null) => void,
): Promise<QuranAudioDownload> {
  const key = recordKey(surahId, reciterCode);
  const existing = readIndex()[key];

  if (
    existing &&
    existing.sourceUrl === sourceUrl &&
    (await isQuranAudioDownloaded(surahId, reciterCode))
  ) {
    return existing;
  }

  const bridge = nativeBridge();
  if (bridge?.isNative && bridge.downloadFile) {
    const path = `quran-audio/${encodeURIComponent(reciterCode)}/${surahId}.mp3`;
    onProgress?.(null);
    const result = await bridge.downloadFile(sourceUrl, path);
    const record: QuranAudioDownload = {
      key,
      surahId,
      reciterCode,
      sourceUrl,
      storage: "native",
      path: result.path || path,
      uri: result.uri,
      downloadedAt: new Date().toISOString(),
    };
    const index = readIndex();
    index[key] = record;
    writeIndex(index);
    onProgress?.(100);
    return record;
  }

  if (!("caches" in window)) {
    throw new Error("التنزيل المحلي غير متاح على هذا الجهاز.");
  }

  const response = await fetch(sourceUrl, {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
  });
  if (!response.ok || !response.body) {
    throw new Error("تعذر تنزيل التلاوة. جرّب مرة أخرى عندما يكون الاتصال مستقرًا.");
  }

  const total = Number(response.headers.get("content-length") || 0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    received += value.byteLength;
    onProgress?.(
      total > 0 ? Math.min(99, Math.round((received / total) * 100)) : null,
    );
  }

  const blob = new Blob(chunks, {
    type: response.headers.get("content-type") || "audio/mpeg",
  });
  const cache = await caches.open(CACHE_NAME);
  await cache.put(
    sourceUrl,
    new Response(blob, {
      headers: {
        "Content-Type": blob.type,
        "Content-Length": String(blob.size),
      },
    }),
  );

  const record: QuranAudioDownload = {
    key,
    surahId,
    reciterCode,
    sourceUrl,
    storage: "cache",
    sizeBytes: blob.size,
    downloadedAt: new Date().toISOString(),
  };
  const index = readIndex();
  index[key] = record;
  writeIndex(index);
  onProgress?.(100);
  return record;
}

export async function removeQuranAudio(
  surahId: number,
  reciterCode: string,
): Promise<void> {
  const key = recordKey(surahId, reciterCode);
  const index = readIndex();
  const record = index[key];
  if (!record) return;

  try {
    if (record.storage === "native") {
      const bridge = nativeBridge();
      const path = record.path || record.uri;
      if (bridge?.deleteFile && path) await bridge.deleteFile(path);
    } else if ("caches" in window) {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(record.sourceUrl);
    }
  } finally {
    delete index[key];
    writeIndex(index);
  }
}

export async function getQuranAudioDownloads(): Promise<QuranAudioDownload[]> {
  return Object.values(readIndex()).sort((a, b) =>
    b.downloadedAt.localeCompare(a.downloadedAt),
  );
}

export async function getQuranAudioUsage(): Promise<{ count: number; bytes: number }> {
  const records = await getQuranAudioDownloads();
  return {
    count: records.length,
    bytes: records.reduce((sum, item) => sum + (item.sizeBytes ?? 0), 0),
  };
}

export async function clearQuranAudioDownloads(): Promise<void> {
  const records = await getQuranAudioDownloads();
  for (const item of records) {
    await removeQuranAudio(item.surahId, item.reciterCode);
  }
}
