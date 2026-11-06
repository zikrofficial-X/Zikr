#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import * as ts from "typescript";

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

const CANONICAL_API_GUARDS = {
  "src/app/api/admin/analytics/route.ts GET": ["analytics.read"],
  "src/app/api/admin/cloudinary/image/route.ts POST": ["media.manage"],
  "src/app/api/admin/cloudinary/image/route.ts GET": [],
  "src/app/api/admin/content/route.ts GET": ["content.manage"],
  "src/app/api/admin/media/route.ts GET": ["media.manage"],
  "src/app/api/admin/media/route.ts POST": ["media.manage"],
  "src/app/api/admin/media/route.ts PATCH": ["media.manage"],
  "src/app/api/admin/overview/route.ts GET": ["dashboard.view"],
  "src/app/api/admin/page-view/route.ts POST": ["analytics.read"],
  "src/app/api/admin/sections/route.ts GET": ["sections.manage"],
  "src/app/api/admin/sections/route.ts POST": ["sections.manage"],
  "src/app/api/admin/site-audio/route.ts GET": ["audio.manage"],
  "src/app/api/admin/site-audio/route.ts POST": ["audio.manage"],
  "src/app/api/admin/site-audio/route.ts PATCH": ["audio.manage"],
  "src/app/api/admin/site-audio/route.ts DELETE": ["audio.manage"],
  "src/app/api/admin/site-audio/upload/route.ts POST": ["audio.manage"],
  "src/app/api/admin/social/facebook/callback/route.ts GET": ["social.manage"],
  "src/app/api/admin/social/facebook/connect/route.ts GET": ["social.manage"],
  "src/app/api/admin/social/youtube/callback/route.ts GET": ["social.manage"],
  "src/app/api/admin/social/youtube/connect/route.ts GET": ["social.manage"],
  "src/app/api/admin/social/route.ts GET": ["social.manage"],
  "src/app/api/admin/social/route.ts POST": ["social.manage", "social.publish"],
  "src/app/api/admin/social/written/route.ts GET": ["social.manage"],
  "src/app/api/admin/social/written/route.ts POST": ["social.manage", "social.publish"],
  "src/app/api/admin/video-generation/narration-upload/route.ts POST": ["video.manage"],
  "src/app/api/admin/video-generation/route.ts GET": ["video.manage"],
  "src/app/api/admin/video-generation/route.ts DELETE": ["video.delete"],
  "src/app/api/admin/video-generation/route.ts PATCH": ["video.manage", "social.publish"],
  "src/app/api/admin/video-generation/sources/route.ts GET": ["video.manage"],
  "src/app/api/admin/video/templates/route.ts GET": ["video.manage"],
  "src/app/api/admin/video/templates/route.ts POST": ["video.manage"],
  "src/app/api/admin/videos/[id]/retry/route.ts POST": ["video.manage"],
  "src/app/api/admin/videos/[id]/route.ts GET": ["video.manage"],
  "src/app/api/admin/videos/[id]/route.ts PATCH": ["video.manage"],
  "src/app/api/admin/videos/[id]/route.ts DELETE": ["video.delete"],
  "src/app/api/admin/videos/create/route.ts POST": ["video.manage"],
  "src/app/api/admin/videos/route.ts GET": ["video.manage"],
  "src/app/api/admin/videos/upload/route.ts POST": ["video.manage"],
  "src/app/api/admin/videos/upload/route.ts GET": [],
  "src/app/api/admin/youtube-facebook/register-media/route.ts POST": ["media.manage"],
  "src/app/api/admin/youtube-facebook/upload-url/route.ts POST": ["media.manage"],
};

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
    if (
      route === "src/app/api/admin/social/written/route.ts" &&
      match[1] === "POST" &&
      !/requireAdminApi\s*\(\s*(["'])social\.publish\1\s*\)/.test(block)
    ) {
      failures.push(route + " POST: auto-published written-content generation requires social.publish.");
    }
    const handlerKey = route + " " + match[1];
    const expectedPermissions = CANONICAL_API_GUARDS[handlerKey];
    if (!expectedPermissions) {
      failures.push(handlerKey + ": missing canonical permission matrix entry.");
    } else {
      const guardMatches = [
        ...block.matchAll(/\brequireAdminApi\s*\(\s*(["'])([^"']+)\1\s*\)|\brequireAdminPermission\s*\(\s*(["'])([^"']+)\3\s*\)|\brequireAdminStepUp\s*\(\s*(["'])([^"']+)\5\s*,/g),
      ];
      const actualPermissions = [...new Set(guardMatches.map((item) => item[2] ?? item[4] ?? item[6]).filter(Boolean))].sort();
      const expectedSorted = [...expectedPermissions].sort();
      if (actualPermissions.join("|") !== expectedSorted.join("|")) {
        failures.push(handlerKey + ": expected [" + expectedSorted.join(", ") + "] but found [" + actualPermissions.join(", ") + "].");
      }
    }
    const result = checkGuardedBlock({
      block,
      label: route + " " + match[1],
      allow405: true,
    });
    if (result === "guarded") apiGuardedCount++;
    if (result === "explicit-405") methodRejectionCount++;
  }
}

function isUseServerDirective(statement) {
  return (
    ts.isExpressionStatement(statement) &&
    (ts.isStringLiteral(statement.expression) ||
      ts.isNoSubstitutionTemplateLiteral(statement.expression)) &&
    statement.expression.text === "use server"
  );
}

function discoverServerActions(file, source) {
  const scriptKind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind);
  const trimmed = source.trimStart();
  const isModuleActionFile =
    trimmed.startsWith('"use server"') || trimmed.startsWith("'use server'");
  const actions = [];

  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.body) {
      const modifiers = node.modifiers ?? [];
      const isAsync = modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword);
      const isExported = modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
      const isInlineAction = isUseServerDirective(node.body.statements[0]);

      if (isAsync && (isModuleActionFile ? isExported : isInlineAction)) {
        actions.push(node);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return { sourceFile, actions };
}

const actionFiles = actionRoots
  .flatMap((actionRoot) => walk(actionRoot))
  .filter((file) => /\.(?:ts|tsx)$/.test(file))
  .map((file) => {
    const source = readFileSync(file, "utf8");
    const discovered = discoverServerActions(file, source);
    return { file, source, ...discovered };
  })
  .filter((entry) => entry.actions.length > 0)
  .sort((a, b) => a.file.localeCompare(b.file));

let actionCount = 0;
let actionGuardedCount = 0;
if (!actionFiles.length) failures.push("no admin server-action files were discovered");

for (const entry of actionFiles) {
  const relativePath = relative(root, entry.file).split(sep).join("/");
  for (const action of entry.actions) {
    actionCount++;
    const block = entry.source.slice(action.getStart(entry.sourceFile), action.end);
    const label = action.name?.text ?? "anonymous";
    const outcome = checkGuardedBlock({
      block,
      label: relativePath + " :: " + label,
    });
    if (outcome === "guarded") actionGuardedCount++;
  }
}

const expectedHandlerCount = Object.keys(CANONICAL_API_GUARDS).length;
if (handlerCount !== expectedHandlerCount) {
  failures.push("canonical API permission matrix expects " + expectedHandlerCount + " handlers, discovered " + handlerCount + ".");
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
    actionCount + " server actions (" + actionGuardedCount + " guarded) by role permission or MFA step-up."
);
