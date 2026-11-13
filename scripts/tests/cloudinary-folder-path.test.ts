import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeCloudinaryFolderPath } from "../../src/features/media/services/cloudinary-folder";

assert.equal(normalizeCloudinaryFolderPath("zikr/kids"), "zikr/kids");
assert.equal(normalizeCloudinaryFolderPath("zikr/avatars"), "zikr/avatars");
assert.equal(normalizeCloudinaryFolderPath("zikr/kids media"), "zikr/kids-media");
assert.equal(normalizeCloudinaryFolderPath("zikr/../kids"), "zikr/kids");
assert.equal(normalizeCloudinaryFolderPath("zikr//kids///"), "zikr/kids");
assert.equal(normalizeCloudinaryFolderPath("../../"), "zikr");
assert.equal(normalizeCloudinaryFolderPath(""), "zikr");

const cloudinarySource = readFileSync(
  resolve(process.cwd(), "src/features/media/services/cloudinary.ts"),
  "utf8",
);
assert.match(
  cloudinarySource,
  /form\.append\(['"]folder['"], normalizeCloudinaryFolderPath\(params\.folder\)\)/,
  "the shared upload path must use the hierarchy-preserving sanitizer",
);

console.log("Cloudinary folder hierarchy contract passed.");
