import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { deleteCloudinaryImageIfUnreferenced, isDefinitiveSupabaseInsertRejection } from "../../src/features/media/services/cloudinary-orphan-compensation";
import { validateCloudinaryImage } from "../../src/features/media/services/cloudinary-validation";
import { buildNextRowVersionUpdatedAt } from "../../src/lib/supabase/row-version";

function image(bytes: number[], type: string, size?: number) {
  const payload = size && size > bytes.length
    ? new Uint8Array(size)
    : new Uint8Array(bytes);
  payload.set(bytes);
  return new File([payload], "upload.bin", { type });
}

await assert.doesNotReject(() =>
  validateCloudinaryImage(image([0xff, 0xd8, 0xff, 0xdb], "image/jpeg")),
);
await assert.doesNotReject(() =>
  validateCloudinaryImage(image([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png")),
);
await assert.doesNotReject(() =>
  validateCloudinaryImage(image([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], "image/webp")),
);
await assert.doesNotReject(() =>
  validateCloudinaryImage(image([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], "image/gif")),
);

await assert.rejects(
  () => validateCloudinaryImage(image([...Buffer.from("<svg onload=alert(1)>")], "image/png")),
  /does not match its declared raster image type/,
  "an SVG/HTML payload disguised as PNG must be rejected before upload",
);
await assert.rejects(
  () => validateCloudinaryImage(image([...Buffer.from("not-an-image")], "image/jpeg")),
  /does not match its declared raster image type/,
);
await assert.rejects(
  () => validateCloudinaryImage(image([0xff, 0xd8, 0xff], "image/svg+xml")),
  /Only JPG, PNG, WEBP, and GIF/,
);
await assert.rejects(
  () => validateCloudinaryImage(image([0x89, 0x50, 0x4e, 0x47], "image/png", 1024), 512),
  /between 1 byte and 0MB/,
);


const cleanupCredentials = { cloudName: "demo-cloud", apiKey: "demo-key", apiSecret: "demo-secret" };
const cleanupNow = new Date("2026-11-13T04:00:00.000Z");
const cleanupPublicId = "zikr-kids/story-123";
const cleanupExpectedPublicId = "story-123";
const cleanupSecureUrl = "https://res.cloudinary.com/demo-cloud/image/upload/v1794542400/zikr-kids/story-123.jpg";
let destroyRequests = 0;

const referencedResult = await deleteCloudinaryImageIfUnreferenced(
  {
    publicId: cleanupPublicId,
    expectedPublicId: cleanupExpectedPublicId,
    secureUrl: cleanupSecureUrl,
    isReferenced: async (asset) => {
      assert.deepEqual(asset, { publicId: cleanupPublicId, secureUrl: cleanupSecureUrl });
      return true;
    },
  },
  {
    credentials: cleanupCredentials,
    now: cleanupNow,
    fetcher: async () => {
      destroyRequests += 1;
      return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
    },
  },
);
assert.equal(referencedResult, "referenced", "a database reference must prevent Cloudinary deletion");
assert.equal(destroyRequests, 0, "a referenced asset must not reach the Cloudinary destroy endpoint");

const deletedResult = await deleteCloudinaryImageIfUnreferenced(
  {
    publicId: cleanupPublicId,
    expectedPublicId: cleanupExpectedPublicId,
    secureUrl: cleanupSecureUrl,
    isReferenced: async () => false,
  },
  {
    credentials: cleanupCredentials,
    now: cleanupNow,
    fetcher: async (input, init) => {
      destroyRequests += 1;
      assert.equal(String(input), "https://api.cloudinary.com/v1_1/demo-cloud/image/destroy");
      assert.equal(init?.method, "POST");
      assert.ok(init?.body instanceof FormData);
      const form = init?.body as FormData;
      const timestamp = String(Math.floor(cleanupNow.getTime() / 1000));
      assert.equal(form.get("public_id"), cleanupPublicId);
      assert.equal(form.get("timestamp"), timestamp);
      assert.equal(form.get("invalidate"), "true");
      assert.equal(form.get("api_key"), "demo-key");
      const expectedSignature = createHash("sha1")
        .update("invalidate=true&public_id=" + cleanupPublicId + "&timestamp=" + timestamp + cleanupCredentials.apiSecret)
        .digest("hex");
      assert.equal(form.get("signature"), expectedSignature);
      assert.equal(new Headers(init?.headers).get("authorization"), "Basic " + Buffer.from("demo-key:demo-secret").toString("base64"));
      return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
    },
  },
);
assert.equal(deletedResult, "deleted", "an unreferenced exact upload may be removed after Cloudinary confirms success");
assert.equal(destroyRequests, 1);

await assert.rejects(
  () => deleteCloudinaryImageIfUnreferenced(
    {
      publicId: cleanupPublicId,
      expectedPublicId: cleanupExpectedPublicId,
      secureUrl: cleanupSecureUrl,
      isReferenced: async () => { throw new Error("reference lookup unavailable"); },
    },
    {
      credentials: cleanupCredentials,
      fetcher: async () => {
        destroyRequests += 1;
        return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
      },
    },
  ),
  /reference lookup unavailable/,
);
assert.equal(destroyRequests, 1, "a failed reference check must fail closed without a provider deletion request");

await assert.rejects(
  () => deleteCloudinaryImageIfUnreferenced(
    {
      publicId: "zikr-kids/other-asset",
      expectedPublicId: cleanupExpectedPublicId,
      secureUrl: cleanupSecureUrl,
      isReferenced: async () => false,
    },
    { credentials: cleanupCredentials, fetcher: async () => { destroyRequests += 1; return new Response("{}", { status: 200 }); } },
  ),
  /exact public ID returned for this upload/,
);
assert.equal(destroyRequests, 1, "a mismatched public ID must not reach Cloudinary");

await assert.rejects(
  () => deleteCloudinaryImageIfUnreferenced(
    {
      publicId: cleanupPublicId,
      expectedPublicId: cleanupExpectedPublicId,
      secureUrl: "https://evil.test/demo-cloud/image/upload/v1794542400/zikr-kids/story-123.jpg",
      isReferenced: async () => false,
    },
    { credentials: cleanupCredentials, fetcher: async () => { destroyRequests += 1; return new Response("{}", { status: 200 }); } },
  ),
  /exact HTTPS Cloudinary image URL/,
);
assert.equal(destroyRequests, 1, "a non-Cloudinary URL must not reach Cloudinary");

const kidsActionSource = readFileSync("src/app/admin/kids/actions.ts", "utf8");
assert.match(kidsActionSource, /featured_image_url=eq\.[\s\S]*?encodeURIComponent\(secureUrl\)/, "Kids compensation must check the exact persisted image URL before deletion");
assert.match(kidsActionSource, /catch \(saveError\)[\s\S]*?compensateOrphanedKidsImage\(uploadedImage, requestedPublicId\)/, "a failed database insert must run guarded orphan compensation");
assert.match(kidsActionSource, /saved\.length !== 1[\s\S]*?compensateOrphanedKidsImage\(uploadedImage, requestedPublicId\)/, "an unconfirmed insert must run guarded orphan compensation");

const mediaAssetsSource = readFileSync("src/features/media/services/media-assets.ts", "utf8");
assert.match(mediaAssetsSource, /url=eq\.[\s\S]*?encodeURIComponent\(secureUrl\)/, "media asset compensation must check the exact persisted delivery URL");
assert.match(mediaAssetsSource, /storage_path=eq\.[\s\S]*?encodeURIComponent\(publicId\)/, "media asset compensation must check the exact persisted Cloudinary public ID");
assert.match(mediaAssetsSource, /catch \(saveError\)[\s\S]*?compensateOrphanedMediaAsset\(upload, requestedPublicId\)/, "a failed media_assets insert must run guarded orphan compensation");
assert.match(mediaAssetsSource, /!Array\.isArray\(rows\) \|\| !rows\[0\][\s\S]*?compensateOrphanedMediaAsset\(upload, requestedPublicId\)/, "an unconfirmed media_assets insert must run guarded orphan compensation");

const sameMillisecond = new Date("2026-11-13T04:00:00.000Z");
assert.equal(
  buildNextRowVersionUpdatedAt("2026-11-13T04:00:00.000Z", sameMillisecond),
  "2026-11-13T04:00:00.001Z",
  "media asset updates must advance the CAS version even when the wall clock has not advanced",
);
assert.equal(
  buildNextRowVersionUpdatedAt("2026-11-13T04:00:00.001Z", sameMillisecond),
  "2026-11-13T04:00:00.002Z",
  "consecutive media asset updates must never reuse the previous CAS version",
);
assert.ok(
  mediaAssetsSource.includes("&updated_at=eq.${encodeURIComponent(current[0].updated_at)}"),
  "every media asset mutation must compare against the row version it read",
);
assert.ok(
  mediaAssetsSource.includes("updated_at: buildNextRowVersionUpdatedAt(current[0].updated_at)"),
  "every media asset mutation must advance its compare-and-set row version",
);
assert.ok(
  mediaAssetsSource.includes('const patch =\n    action === "verify_rights"') &&
    mediaAssetsSource.includes("{ rights_verified: true, verified_rights: true }"),
  "rights verification must use the same guarded row-version update path",
);
assert.equal(
  mediaAssetsSource.includes("updated_at: new Date().toISOString()"),
  false,
  "media asset writes must not reuse a millisecond-precision wall-clock CAS token",
);


assert.equal(
  isDefinitiveSupabaseInsertRejection(new Error("Supabase REST 400: invalid payload")),
  true,
  "an explicit PostgREST validation rejection proves the insert transaction did not commit",
);
assert.equal(
  isDefinitiveSupabaseInsertRejection(new Error("Supabase REST 409: duplicate key")),
  true,
  "a definitive conflict rejection may use guarded upload compensation",
);
for (const ambiguous of [
  new Error("Supabase REST 408: request timeout"),
  new Error("Supabase REST 429: rate limited"),
  new Error("Supabase REST 500: internal error"),
  new Error("fetch failed"),
  new Error("The operation was aborted"),
]) {
  assert.equal(
    isDefinitiveSupabaseInsertRejection(ambiguous),
    false,
    "ambiguous transport, timeout, rate-limit, and server outcomes must retain uploaded media",
  );
}

assert.ok(
  kidsActionSource.includes("if (isDefinitiveSupabaseInsertRejection(saveError))") &&
    kidsActionSource.includes("retaining the Cloudinary image for reconciliation"),
  "Kids image compensation must run only after a definitive database rejection",
);
assert.ok(
  mediaAssetsSource.includes("if (isDefinitiveSupabaseInsertRejection(saveError))") &&
    mediaAssetsSource.includes("retaining the Cloudinary asset for reconciliation"),
  "media asset compensation must retain uploads after ambiguous database outcomes",
);
assert.ok(
  mediaAssetsSource.includes('...(input.folder === "kids" ? { scope: "kids", section: "kids" } : {})'),
  "assets uploaded into the Kids folder must carry the metadata scope consumed by Kids governance",
);
const kidsAssetsPageSource = readFileSync("src/app/admin/kids/assets/page.tsx", "utf8");
assert.ok(
  kidsAssetsPageSource.includes("asset.asset_type, asset.media_type"),
  "Kids governance must include legacy assets explicitly typed as Kids even when metadata tags are absent",
);


const mediaAssetsRouteSource = readFileSync("src/app/api/admin/media/route.ts", "utf8");
assert.match(
  mediaAssetsSource,
  /export class AdminMediaInputError/,
  "media asset validation must have a typed client-input error",
);
assert.match(
  mediaAssetsSource,
  /validateCloudinaryImage\(input\.file, MAX_IMAGE_BYTES\)[\s\S]*?new AdminMediaInputError/,
  "invalid raster signatures must be classified as client input errors before upload",
);
assert.match(
  mediaAssetsRouteSource,
  /error instanceof AdminMediaInputError[\s\S]*?responseError\(error\.message, 400\)/,
  "invalid media uploads must return HTTP 400 instead of an internal-server error",
);
assert.match(
  mediaAssetsRouteSource,
  /audit event unavailable after asset creation/,
  "an audit-log outage after a committed upload must not report the upload as failed",
);
assert.match(
  mediaAssetsRouteSource,
  /audit event unavailable after asset update/,
  "an audit-log outage after a committed metadata update must not report the update as failed",
);
\nconsole.log("Cloudinary raster signature and orphan compensation contracts passed.");
