import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const cloudinaryUpload = read("src/features/media/services/cloudinary.ts");
const adminUploadRoute = read("src/app/api/admin/cloudinary/image/route.ts");

assert.match(
  cloudinaryUpload,
  /form\.append\(['"]overwrite['"], ['"]false['"]\)/,
  "Cloudinary uploads must fail on an existing public ID rather than silently replace an existing asset",
);
assert.doesNotMatch(
  cloudinaryUpload,
  /form\.append\(['"]overwrite['"], ['"]true['"]\)/,
  "the shared upload helper must never opt into implicit destructive overwrite",
);
assert.match(
  adminUploadRoute,
  /requestedPublicId/,
  "the regression contract must cover the admin endpoint that accepts a caller-supplied public ID",
);

console.log("Cloudinary upload overwrite-safety contract passed.");
