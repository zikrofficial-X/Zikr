#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const scanDirs = ["src/features", "src/app"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".json"]);
const failures = [];

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!extensions.has(full.slice(full.lastIndexOf(".")))) continue;

    const content = readFileSync(full, "utf8");
    const matches = content.split(/\r?\n/).flatMap((line, index) =>
      line.includes("�") ? [`${relative(root, full)}:${index + 1}: ${line.trim()}`] : [],
    );
    failures.push(...matches);
  }
}

for (const dir of scanDirs) walk(join(root, dir));

if (failures.length) {
  console.error("CONTENT_INTEGRITY_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log("✅ Content integrity check passed");
