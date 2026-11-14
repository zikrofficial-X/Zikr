import "server-only";

import { getContactRateLimitActorId } from "@/features/contact/rate-limit-identity";
import { createAdminClient } from "@/lib/supabase/server";

const RATE_LIMIT_BUCKET = "public_kids_content_share";
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_SECONDS = 60;

/**
 * Uses the shared database-backed limiter so requests are counted across
 * serverless instances. The HMAC-derived actor ID keeps raw IPs out of storage.
 */
export async function consumeKidsShareRateLimit(clientIdentifier: string): Promise<boolean> {
  const supabase = createAdminClient();
  const actorId = getContactRateLimitActorId(
    clientIdentifier,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  );
  const { data, error } = await supabase.rpc("consume_admin_rate_limit", {
    p_actor: actorId,
    p_bucket: RATE_LIMIT_BUCKET,
    p_limit: RATE_LIMIT_MAX_REQUESTS,
    p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
  });

  if (error || typeof data !== "boolean") {
    console.error("[kids share rate limit] RPC failed", error?.code ?? "invalid_result");
    throw new Error("Shared Kids share rate limit is unavailable");
  }

  return data;
}
