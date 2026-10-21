#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const apiRoot = join(root, "src/app/api/admin");
const actionRoots = [
  join(root, "src/app/admin"),
  join(root, "src/features/admin/actions"),
].filter((dir) => existsSync(dir));
const failures = [];
const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);

if (!existsSync(apiRoot) || actionRoots.length === 0) {
  console.error("ADMIN_SECURITY_SURFACE_CHECK_FAILED: admin API or action root is missing.");
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) out.push(...walk(fullPath));
    else if (item.isFile()) out.push(fullPath);
  }
  return out;
}

function isMethodRejectionOnly(block) {
  // Explicit 405 stubs have no data access or side effects and need no role lookup.
  return (
    /return\s+(?:NextResponse\.json|(?:jsonError|errorResponse))\(\s*['"]Method not allowed['"]\s*,\s*405\s*\)/i.test(block) &&
    !/(?:createAdminClient|supabaseServerAdminRequest|dispatchGitHubWorkflow|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.upsert\s*\(|uploadCloudinaryImage|createPresignedUploadUrl|createVideoGenerationRequest|fetch\s*\()/i.test(block)
  );
}

const privilegedPatterns = [
  /\brequest\.(?:json|formData|text|arrayBuffer)\s*\(/,
  /\bsupabaseServerAdminRequest\s*[<(]?/,
  /\bcreateAdminClient\s*\(/,
  /\bdispatchGitHubWorkflow\s*\(/,
  /\b(?:uploadCloudinaryImage|createPresignedUploadUrl|createVideoGenerationRequest|toggleManagedContent|deleteManagedContent)\s*\(/,
  /\bsupabase\s*\.from\s*\(/,
];

function checkGuardedBlock({ block, label, allow405 = false }) {
  const gatePattern =
    /\brequireAdminApi\s*\(\s*(['"])([a-z][a-z0-9_-]*\.[a-z][a-z0-9_.-]*)\1\s*\)|\brequireAdminPermission\s*\(\s*(['"])([a-z][a-z0-9_-]*\.[a-z0-9_.-]*)\3\s*\)|\brequireAdminStepUp\s*\(\s*(['"])([a-z][a-z0-9_-]*\.[a-z][a-z0-9_.-]*)\5\s*,|\brequireAdmin\s*\(\s*\)/;
  const gate = gatePattern.exec(block);

  if (!gate && allow405 && isMethodRejectionOnly(block)) {
    return "explicit-405";
  }
  if (!gate) {
    failures.push(label + ": missing a server-side admin permission/step-up guard");
    return "missing";
  }

  if (gate.index > 900) {
    failures.push(label + ": authorization guard is too far from the entry point");
  }

  let firstPrivilegedIndex = Infinity;
  for (const pattern of privilegedPatterns) {
    const candidate = pattern.exec(block);
    if (candidate && candidate.index < firstPrivilegedIndex) {
      firstPrivilegedIndex = candidate.index;
    }
  }
  if (firstPrivilegedIndex !== Infinity && gate.index > firstPrivilegedIndex) {
    failures.push(label + ": protected work begins before authorization");
  }

  return "guarded";
}

const routeFiles = walk(apiRoot)
  .filter((file) => file.endsWith("route.ts"))
  .sort();
let handlerCount = 0;
let apiGuardedCount = 0;
let methodRejectionCount = 0;

if (!routeFiles.length) failures.push("no admin API route files were discovered");

for (const file of routeFiles) {
  const source = readFileSync(file, "utf8");
  const route = relative(root, file).split(sep).join("/");
  const handlers = [
    ...source.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s*\(/g),
  ].filter((match) => methods.has(match[1]));

  if (!handlers.length) {
    failures.push(route + ": route.ts exports no recognized HTTP handler");
    continue;
  }

  for (let i = 0; i < handlers.length; i++) {
    handlerCount++;
    const match = handlers[i];
    const end = handlers[i + 1]?.index ?? source.length;
    const block = source.slice(match.index, end);
    const result = checkGuardedBlock({
      block,
      label: route + " " + match[1],
      allow405: true,
    });
    if (result === "guarded") apiGuardedCount++;
    if (result === "explicit-405") methodRejectionCount++;
  }
}

const actionFiles = [...new Set(
  actionRoots.flatMap((actionRoot) => walk(actionRoot))
    .filter((file) => /\.(?:ts|tsx)$/.test(file))
    .filter((file) => {
      const source = readFileSync(file, "utf8").trimStart();
      return source.startsWith('"use server"') || source.startsWith("'use server'");
    }),
)].sort();

let actionCount = 0;
let actionGuardedCount = 0;
if (!actionFiles.length) failures.push("no admin server-action files were discovered");

for (const file of actionFiles) {
  const source = readFileSync(file, "utf8");
  const relativePath = relative(root, file).split(sep).join("/");
  const actions = [
    ...source.matchAll(/export\s+async\s+function\s+([A-Za-z0-9_]+)\s*\(/g),
  ];

  if (!actions.length) {
    failures.push(relativePath + ": server-action module exports no async action");
    continue;
  }

  for (let i = 0; i < actions.length; i++) {
    actionCount++;
    const match = actions[i];
    const end = actions[i + 1]?.index ?? source.length;
    const block = source.slice(match.index, end);
    const outcome = checkGuardedBlock({
      block,
      label: relativePath + " :: " + match[1],
    });
    if (outcome === "guarded") actionGuardedCount++;
  }
}

if (handlerCount < routeFiles.length) failures.push("HTTP handler inventory is inconsistent with the route-file inventory");

if (failures.length) {
  console.error("ADMIN_SECURITY_SURFACE_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}

console.log(
  "✅ Admin security-surface audit passed: " +
    routeFiles.length + " API route files, " +
    handlerCount + " API handlers (" + apiGuardedCount + " guarded, " + methodRejectionCount + " explicit 405 stubs), " +
    actionFiles.length + " server-action modules across app/admin and features/admin/actions, " +
    actionCount + " server actions guarded by role permission or MFA step-up."
);
