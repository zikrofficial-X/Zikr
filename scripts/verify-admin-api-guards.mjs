#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const apiRoot = join(root, "src/app/api/admin");
const failures = [];
const audit = [];
const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);

if (!existsSync(apiRoot)) {
  console.error("ADMIN_API_GUARD_CHECK_FAILED: admin API root is missing.");
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) out.push(...walk(fullPath));
    else if (item.isFile() && item.name === "route.ts") out.push(fullPath);
  }
  return out;
}

function isMethodRejectionOnly(block) {
  // Explicit 405 stubs have no data access or side effects and need no role lookup.
  const compact = block
    .replace(/export\s+async\s+function\s+[A-Z]+\s*\([^)]*\)\s*\{?/, "")
    .replace(/\s+/g, " ")
    .trim();
  return (
    /return\s+(?:NextResponse\.json|(?:jsonError|errorResponse))\(\s*['"]Method not allowed['"]\s*,\s*405\s*\)/i.test(compact) &&
    !/(?:createAdminClient|supabaseServerAdminRequest|dispatchGitHubWorkflow|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.upsert\s*\(|uploadCloudinaryImage|createPresignedUploadUrl|fetch\s*\()/i.test(compact)
  );
}

const routeFiles = walk(apiRoot).sort();
let handlerCount = 0;
let guardedCount = 0;
let methodRejectionCount = 0;

if (!routeFiles.length) failures.push("no admin API route files were discovered");

for (const file of routeFiles) {
  const source = readFileSync(file, "utf8");
  const route = relative(root, file).replaceAll("\\\\", "/");
  const handlers = [...source.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s*\(/g)]
    .filter((match) => methods.has(match[1]));

  if (!handlers.length) {
    failures.push(route + ": route.ts exports no recognized HTTP handler");
    continue;
  }

  for (let i = 0; i < handlers.length; i++) {
    handlerCount++;
    const match = handlers[i];
    const end = handlers[i + 1]?.index ?? source.length;
    const block = source.slice(match.index, end);
    const label = route + " " + match[1];
    const gatePattern = /\brequireAdminApi\s*\(\s*(['"])([a-z][a-z0-9_-]*\.[a-z][a-z0-9_.-]*)\1\s*\)|\brequireAdminPermission\s*\(\s*(['"])([a-z][a-z0-9_-]*\.[a-z][a-z0-9_.-]*)\3\s*\)|\brequireAdmin\s*\(\s*\)/;
    const gate = gatePattern.exec(block);

    if (!gate && isMethodRejectionOnly(block)) {
      methodRejectionCount++;
      audit.push({ route: label, outcome: "explicit-405" });
      continue;
    }

    if (!gate) {
      failures.push(label + ": missing a server-side admin permission guard");
      continue;
    }

    // Authentication and authorization must precede request parsing and privileged work.
    const privilegedPatterns = [
      /\brequest\.(?:json|formData|text|arrayBuffer)\s*\(/,
      /\bsupabaseServerAdminRequest\s*[<(]?/,
      /\bcreateAdminClient\s*\(/,
      /\bdispatchGitHubWorkflow\s*\(/,
      /\b(?:uploadCloudinaryImage|createPresignedUploadUrl|createVideoGenerationRequest)\s*\(/,
      /\bsupabase\s*\.from\s*\(/,
    ];
    let firstPrivilegedIndex = Infinity;
    for (const pattern of privilegedPatterns) {
      const candidate = pattern.exec(block);
      if (candidate && candidate.index < firstPrivilegedIndex) firstPrivilegedIndex = candidate.index;
    }

    if (gate.index > 900) {
      failures.push(label + ": admin permission guard is too far from the handler entry");
    }
    if (firstPrivilegedIndex !== Infinity && gate.index > firstPrivilegedIndex) {
      failures.push(label + ": protected work begins before authorization");
    }
    guardedCount++;
    audit.push({ route: label, outcome: "guarded", permission: gate[2] || gate[4] || "admin" });
  }
}

if (handlerCount < routeFiles.length) {
  failures.push("handler inventory is inconsistent with the route-file inventory");
}

if (failures.length) {
  console.error("ADMIN_API_GUARD_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}

console.log(
  "✅ Admin API guard audit passed: " +
    routeFiles.length + " route files, " +
    handlerCount + " handlers, " +
    guardedCount + " authorization-guarded handlers, " +
    methodRejectionCount + " explicit method-rejection stubs."
);
