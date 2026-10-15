import sharp from "sharp";
import { stat, unlink } from "node:fs/promises";

const jobs = [
  {
    input: "public/branding/logo-gold.png",
    output: "public/branding/logo-gold.webp",
    format: "webp",
    resize: { width: 512, height: 512, fit: "contain", withoutEnlargement: true },
    options: { quality: 90, effort: 6 },
  },
  {
    input: "public/branding/og-image.png",
    output: "public/branding/og-image.jpg",
    format: "jpeg",
    resize: { width: 1200, height: 630, fit: "cover", position: "centre" },
    options: { quality: 82, mozjpeg: true, progressive: true, subsampling: 1 },
  },
  ...["scene-night-garden", "scene-moon-sky", "scene-mosque-courtyard"].map(name => ({
    input: `public/kids/games/${name}.png`,
    output: `public/kids/games/${name}.webp`,
    format: "webp",
    resize: { width: 2560, height: 1440, fit: "inside", withoutEnlargement: true },
    options: { quality: 78, effort: 6 },
  })),
];
await Promise.all(jobs.map(async job => {
  await sharp(job.input).rotate().resize(job.resize)[job.format](job.options).toFile(job.output);
}));
await Promise.all(jobs.map(job => unlink(job.input)));
for (const job of jobs) console.log(`${job.output}: ${(((await stat(job.output)).size) / 1024).toFixed(1)} KiB`);
