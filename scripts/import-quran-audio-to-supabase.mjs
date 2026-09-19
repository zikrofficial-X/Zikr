import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "quran-audio";
const MAX_FILE_MB = Number(process.env.QURAN_AUDIO_MAX_FILE_MB || "50");
const CONCURRENCY = Math.max(1, Math.min(4, Number(process.env.QURAN_AUDIO_CONCURRENCY || "2")));

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "zikr-quran-audio-"));
const limitBytes = MAX_FILE_MB * 1024 * 1024;

function sourceUrl(row) {
  if (row.audio_url && /^https?:\/\//i.test(row.audio_url)) return row.audio_url;
  return null;
}

function storagePath(reciter, surahId) {
  const code = String(reciter.code || "").replace(/^ar\./i, "").toLowerCase();
  return `reciters/${code}/${String(surahId).padStart(3, "0")}.mp3`;
}

function publicUrl(filePath) {
  const base = SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${filePath}`;
}

async function updateRow(id, patch) {
  const { error } = await supabase.from("quran_audio").update(patch).eq("id", id);
  if (error) throw error;
}

async function uploadOne(row, reciter) {
  const source = sourceUrl(row);
  if (!source) throw new Error(`Missing external source URL for quran_audio ${row.id}`);

  const filePath = storagePath(reciter, row.surah_id);
  const tmpFile = path.join(tmpRoot, filePath.replaceAll("/", "__"));

  try {
    await updateRow(row.id, {
      storage_bucket: BUCKET,
      storage_path: filePath,
      storage_status: "uploading",
      mime_type: "audio/mpeg",
    });

    const response = await fetch(source, {
      headers: { "User-Agent": "ZIKR-Quran-Storage-Importer/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(180000),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Download failed ${response.status} for ${source}`);
    }

    const contentLength = Number(response.headers.get("content-length") || "0");
    if (contentLength > limitBytes) {
      throw new Error(`File is ${(contentLength / 1024 / 1024).toFixed(2)} MB, above the configured ${MAX_FILE_MB} MB limit.`);
    }

    await fs.mkdir(path.dirname(tmpFile), { recursive: true });
    await pipeline(response.body, createWriteStream(tmpFile));

    const stat = await fs.stat(tmpFile);
    if (stat.size <= 0) throw new Error("Downloaded audio file is empty.");
    if (stat.size > limitBytes) {
      throw new Error(`Downloaded file is ${(stat.size / 1024 / 1024).toFixed(2)} MB, above the configured ${MAX_FILE_MB} MB limit.`);
    }

    const buffer = await fs.readFile(tmpFile);
    const sha256 = createHash("sha256").update(buffer).digest("hex");

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: "audio/mpeg",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const internalUrl = publicUrl(filePath);
    await updateRow(row.id, {
      audio_url: internalUrl,
      storage_bucket: BUCKET,
      storage_path: filePath,
      storage_url: internalUrl,
      storage_status: "ready",
      storage_size_bytes: stat.size,
      storage_sha256: sha256,
      storage_uploaded_at: new Date().toISOString(),
      mime_type: "audio/mpeg",
    });

    return { ok: true, id: row.id, surah: row.surah_id, reciter: reciter.code, bytes: stat.size };
  } catch (error) {
    await updateRow(row.id, {
      storage_bucket: BUCKET,
      storage_path: filePath,
      storage_url: publicUrl(filePath),
      storage_status: "failed",
    }).catch(() => {});
    throw error;
  } finally {
    await fs.rm(tmpFile, { force: true }).catch(() => {});
  }
}

async function main() {
  const { data: surahs, error: surahError } = await supabase
    .from("quran_surahs")
    .select("id,ayahs_count")
    .order("id");
  if (surahError) throw surahError;
  if (!surahs || surahs.length !== 114) throw new Error(`Expected 114 surahs, found ${surahs?.length ?? 0}`);

  const { count: ayahCount, error: ayahError } = await supabase
    .from("quran_ayahs")
    .select("id", { count: "exact", head: true });
  if (ayahError) throw ayahError;
  if (ayahCount !== 6236) throw new Error(`Expected 6236 ayahs, found ${ayahCount ?? 0}`);

  const { data: reciters, error: reciterError } = await supabase
    .from("quran_reciters")
    .select("id,code,name_ar,name_en");
  if (reciterError) throw reciterError;
  if (!reciters?.length) throw new Error("No Quran reciters found.");

  const { data: rows, error: audioError } = await supabase
    .from("quran_audio")
    .select("id,surah_id,reciter_id,audio_url,storage_status")
    .order("reciter_id")
    .order("surah_id");
  if (audioError) throw audioError;

  const reciterById = new Map(reciters.map(r => [r.id, r]));
  const tasks = (rows || []).map(row => ({ row, reciter: reciterById.get(row.reciter_id) })).filter(x => x.reciter);

  console.log(`Preparing ${tasks.length} canonical Quran audio files with concurrency=${CONCURRENCY}`);

  let cursor = 0;
  let succeeded = 0;
  let failed = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= tasks.length) return;
      const task = tasks[index];

      if (task.row.storage_status === "ready") {
        console.log(`SKIP ${task.reciter.code} ${task.row.surah_id}: already ready`);
        succeeded++;
        continue;
      }

      try {
        const result = await uploadOne(task.row, task.reciter);
        succeeded++;
        console.log(`OK ${result.reciter} ${result.surah} ${result.bytes} bytes`);
      } catch (error) {
        failed++;
        console.error(`FAIL ${task.reciter.code} ${task.row.surah_id}: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const { data: finalRows, error: finalError } = await supabase
    .from("quran_audio")
    .select("storage_status");
  if (finalError) throw finalError;

  const ready = (finalRows || []).filter(r => r.storage_status === "ready").length;
  const expected = 114 * reciters.length;

  console.log(JSON.stringify({ expected, ready, succeeded, failed }, null, 2));

  if (ready !== expected) {
    throw new Error(`Quran audio import incomplete: ${ready}/${expected} ready`);
  }
}

try {
  await main();
} finally {
  await fs.rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
}
