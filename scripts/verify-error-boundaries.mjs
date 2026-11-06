import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rootError = readFileSync("src/app/error.tsx", "utf8");
const globalError = readFileSync("src/app/global-error.tsx", "utf8");

assert.match(rootError, /export default function ErrorBoundary/);
assert.doesNotMatch(rootError, /<html\b|<body\b/);
assert.match(rootError, /onClick={reset}/);
assert.match(rootError, /href="\/"/);

assert.match(globalError, /export default function GlobalError/);
assert.match(globalError, /<html lang="ar" dir="rtl">/);
assert.match(globalError, /<body/);
assert.match(globalError, /onClick={reset}/);
assert.match(globalError, /process\.env\.NODE_ENV !== 'production'/);
assert.doesNotMatch(globalError, /dangerouslySetInnerHTML/);

console.log("Error boundary contracts passed.");
