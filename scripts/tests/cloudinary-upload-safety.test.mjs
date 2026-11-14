import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const cloudinaryUpload = read("src/features/media/services/cloudinary.ts");
const adminUploadRoute = read("src/app/api/admin/cloudinary/image/route.ts");
const kidsAdminActions = read("src/app/admin/kids/actions.ts");
const orphanCompensation = read("src/features/media/services/cloudinary-orphan-compensation.ts");

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

assert.match(kidsAdminActions, /async function compensateOrphanedKidsImage/);
assert.match(kidsAdminActions, /featured_image_url=eq\./,
  "Kids upload compensation must check the exact image URL against the Kids content table");
assert.match(kidsAdminActions, /if \(!Array\.isArray\(rows\)\)[\s\S]*?Unable to verify whether the uploaded Kids image is still referenced/,
  "a failed reference lookup must fail closed and retain the uploaded image");
assert.match(kidsAdminActions, /isDefinitiveSupabaseInsertRejection\(saveError\)[\s\S]*?compensateOrphanedKidsImage/,
  "only a definitive rejected insert may trigger immediate Kids image compensation");
assert.match(kidsAdminActions, /database insert outcome is ambiguous; retaining the Cloudinary image/,
  "ambiguous database outcomes must retain the upload for reconciliation");
assert.match(orphanCompensation, /if \(await params\.isReferenced/);
assert.match(orphanCompensation, /return "referenced"/);
assert.ok(
  orphanCompensation.indexOf("if (await params.isReferenced") <
    orphanCompensation.indexOf("dependencies.fetcher ?? fetch"),
  "the shared compensation helper must verify references before issuing a Cloudinary deletion",
);

console.log("Cloudinary upload overwrite-safety contract passed.");
