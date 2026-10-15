import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredAssets = [
  { path: "public/branding/logo-gold.webp", maxBytes: 100 * 1024 },
  { path: "public/branding/og-image.jpg", maxBytes: 200 * 1024 },
];
const retiredAssets = [
  "public/kids/games/scene-night-garden.webp",
  "public/kids/games/scene-moon-sky.webp",
  "public/kids/games/scene-mosque-courtyard.webp",
];
const staleReferences = [
  /logo-gold\.png\b/i,
  /og-image\.png\b/i,
  /scene-(?:night-garden|moon-sky|mosque-courtyard)\.png\b/i,
];
const textExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".md", ".json", ".webmanifest"]);
const scanRoots = ["src", "scripts", "docs/KIDS_GAME_ASSETS.md", "docs/assets-guide.md"];
const errors = [];

function scanFile(filePath) {
  const content = fs.readFileSync(path.join(root, filePath), "utf8");
  content.split(/\r?\n/).forEach((line, index) => {
    for (const pattern of staleReferences) {
      if (pattern.test(line)) errors.push(`${filePath}:${index + 1}: legacy image path remains`);
    }
  });
}
function scanPath(targetPath) {
  const fullPath = path.join(root, targetPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing path: ${targetPath}`);
    return;
  }
  if (fs.statSync(fullPath).isDirectory()) {
    for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
      const child = path.join(targetPath, entry.name);
      if (entry.isDirectory()) scanPath(child);
      else if (textExtensions.has(path.extname(entry.name).toLowerCase())) scanFile(child);
    }
  } else if (textExtensions.has(path.extname(fullPath).toLowerCase())) scanFile(targetPath);
}
for (const asset of requiredAssets) {
  const fullPath = path.join(root, asset.path);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Required optimized asset is missing: ${asset.path}`);
    continue;
  }
  const bytes = fs.statSync(fullPath).size;
  if (bytes > asset.maxBytes) errors.push(`${asset.path} is ${(bytes / 1024).toFixed(1)} KiB; limit is ${(asset.maxBytes / 1024).toFixed(0)} KiB`);
}
for (const asset of retiredAssets) {
  if (fs.existsSync(path.join(root, asset))) errors.push(`Unused legacy background asset is still bundled: ${asset}`);
}
for (const target of scanRoots) scanPath(target);
if (errors.length) {
  console.error("Image asset verification failed:");
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
const total = requiredAssets.reduce((sum, asset) => sum + fs.statSync(path.join(root, asset.path)).size, 0);
console.log(`Image asset verification passed (${requiredAssets.length} assets; ${(total / 1024).toFixed(1)} KiB combined; legacy references and unused backgrounds absent).`);
