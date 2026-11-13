import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { deleteCloudinaryImageIfUnreferenced } from "../../src/features/media/services/cloudinary-orphan-compensation";
import { validateCloudinaryImage } from "../../src/features/media/services/cloudinary-validation";

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
      const form = init.body as FormData;
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
console.log("Cloudinary raster signature and orphan compensation contracts passed.");
