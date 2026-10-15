import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { getContactRateLimitActorId } from "@/features/contact/rate-limit-identity";

const RATE_LIMIT_BUCKET = "public_contact_submission";
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 600;

/**
 * Uses the database's atomic, service-role-only rate-limit RPC so counts are
 * shared across serverless instances. Fails closed if the limiter is unavailable.
 */
export async function consumePublicContactRateLimit(clientIdentifier: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("consume_admin_rate_limit", {
    p_actor: getContactRateLimitActorId(clientIdentifier),
    p_bucket: RATE_LIMIT_BUCKET,
    p_limit: RATE_LIMIT_MAX_REQUESTS,
    p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
  });

  if (error || typeof data !== "boolean") {
    console.error("[contact rate limit] RPC failed", error?.code ?? "invalid_result");
    throw new Error("Shared contact rate limit is unavailable");
  }

  return data;
}
