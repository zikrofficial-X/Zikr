import { createHash } from "node:crypto";

export type CloudinaryCleanupCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export type CloudinaryCleanupResult = "deleted" | "referenced" | "not_found";

export async function deleteCloudinaryImageIfUnreferenced(
  params: {
    publicId: string;
    expectedPublicId: string;
    secureUrl: string;
    isReferenced: (asset: { publicId: string; secureUrl: string }) => Promise<boolean>;
  },
  dependencies: {
    credentials: CloudinaryCleanupCredentials;
    fetcher?: typeof fetch;
    now?: Date;
  },
): Promise<CloudinaryCleanupResult> {
  const publicId = params.publicId.trim();
  const expectedPublicId = params.expectedPublicId
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  if (!expectedPublicId || !(publicId === expectedPublicId || publicId.endsWith("/" + expectedPublicId))) {
    throw new Error("Cloudinary cleanup requires the exact public ID returned for this upload.");
  }

  const cloudName = dependencies.credentials.cloudName.trim();
  const apiKey = dependencies.credentials.apiKey.trim();
  const apiSecret = dependencies.credentials.apiSecret.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary cleanup credentials are incomplete.");
  }

  let assetUrl: URL;
  try {
    assetUrl = new URL(params.secureUrl);
  } catch {
    throw new Error("Cloudinary cleanup requires the exact HTTPS Cloudinary image URL.");
  }
  const decodedPath = decodeURIComponent(assetUrl.pathname);
  if (
    assetUrl.protocol !== "https:" ||
    assetUrl.hostname !== "res.cloudinary.com" ||
    !decodedPath.includes("/" + cloudName + "/image/upload/") ||
    !decodedPath.includes("/" + publicId + ".")
  ) {
    throw new Error("Cloudinary cleanup requires the exact HTTPS Cloudinary image URL.");
  }

  if (await params.isReferenced({ publicId, secureUrl: params.secureUrl })) {
    return "referenced";
  }

  const now = dependencies.now ?? new Date();
  if (!Number.isFinite(now.getTime())) {
    throw new Error("Cloudinary cleanup requires a valid timestamp.");
  }
  const timestamp = Math.floor(now.getTime() / 1000);
  const signatureSource = "invalidate=true&public_id=" + publicId + "&timestamp=" + timestamp + apiSecret;
  const signature = createHash("sha1").update(signatureSource).digest("hex");
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("invalidate", "true");
  form.append("api_key", apiKey);
  form.append("signature", signature);

  const response = await (dependencies.fetcher ?? fetch)(
    "https://api.cloudinary.com/v1_1/" + encodeURIComponent(cloudName) + "/image/destroy",
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(apiKey + ":" + apiSecret).toString("base64"),
      },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );
  const payload = (await response.json().catch(() => ({}))) as {
    result?: string;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Cloudinary orphan cleanup failed (HTTP " + response.status + ").");
  }
  if (payload.result === "ok") return "deleted";
  if (payload.result === "not found") return "not_found";
  throw new Error("Cloudinary did not confirm deletion of the exact uploaded asset.");
}

const DEFINITIVE_SUPABASE_INSERT_REJECTION_STATUSES = new Set([
  400,
  401,
  403,
  404,
  409,
  413,
  415,
  422,
]);

/**
 * A cleanup is safe only when Supabase explicitly rejected the insert before
 * committing it. Timeouts, transport failures, rate limits, and 5xx responses
 * have an ambiguous outcome, so callers must retain the uploaded asset.
 */
export function isDefinitiveSupabaseInsertRejection(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const match = /^Supabase REST (\d{3}):/.exec(error.message);
  return Boolean(
    match &&
      DEFINITIVE_SUPABASE_INSERT_REJECTION_STATUSES.has(Number(match[1])),
  );
}
