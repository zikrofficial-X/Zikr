import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';
import { dirname, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import https from 'node:https';

const gunzipAsync = promisify(gunzip);
const outputPath = resolve(process.cwd(), 'vendor/ffmpeg');
const archivePath = resolve(process.cwd(), 'vendor/ffmpeg-linux-x64.gz');
const url = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64.gz';
const expectedSha256 = 'bfe8a8fc511530457b528c48d77b5737527b504a3797a9bc4866aeca69c2dffa';

async function download(urlString, target) {
  await new Promise((resolvePromise, reject) => {
    const request = https.get(urlString, { headers: { 'User-Agent': 'ZIKR-build/1.0' } }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        resolvePromise(download(response.headers.location, target));
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`ffmpeg download failed with HTTP ${response.statusCode}`));
        return;
      }
      const output = createWriteStream(target, { mode: 0o755 });
      pipeline(response, output).then(resolvePromise, reject);
    });
    request.on('error', reject);
    request.setTimeout(120000, () => request.destroy(new Error('ffmpeg download timed out')));
  });
}

async function main() {
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    console.log(`[ensure-ffmpeg] Skipping bundled Linux binary on ${process.platform}/${process.arch}.`);
    return;
  }

  await mkdir(dirname(outputPath), { recursive: true });

  try {
    const existing = await readFile(outputPath);
    if (existing.length > 1024) {
      console.log('[ensure-ffmpeg] Existing bundled ffmpeg found.');
      return;
    }
  } catch {
    // Missing file; download below.
  }

  console.log('[ensure-ffmpeg] Downloading pinned static ffmpeg build...');
  await download(url, archivePath);
  const archive = await readFile(archivePath);
  const actualSha256 = createHash('sha256').update(archive).digest('hex');
  if (actualSha256 !== expectedSha256) {
    throw new Error(`ffmpeg archive checksum mismatch: expected ${expectedSha256}, got ${actualSha256}`);
  }

  const binary = await gunzipAsync(archive);
  if (binary.length < 1024 * 1024) {
    throw new Error(`ffmpeg binary is unexpectedly small: ${binary.length} bytes`);
  }
  await writeFile(outputPath, binary, { mode: 0o755 });
  console.log(`[ensure-ffmpeg] Bundled ffmpeg at ${outputPath} (${binary.length} bytes).`);
}

main().catch(error => {
  console.error('[ensure-ffmpeg] Fatal:', error);
  process.exit(1);
});
