import "server-only";

import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import type { AdminProfile } from "@/lib/services/admin";

export async function enforceAdminRateLimit(
  profile: AdminProfile,
  bucket: string,
  limit = 20,
  windowSeconds = 60,
) {
  const rows = await supabaseServerAdminRequest<Array<{ consume_admin_rate_limit: boolean }>>(
    "/rest/v1/rpc/consume_admin_rate_limit",
    {
      method: "POST",
      body: JSON.stringify({
        p_bucket: bucket,
        p_actor: profile.id,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      }),
    },
  );

  const allowed = Array.isArray(rows) ? Boolean(rows[0]?.consume_admin_rate_limit) : Boolean(rows);
  if (!allowed) throw new Error("تم تجاوز حد العمليات مؤقتًا. انتظر قليلًا ثم أعد المحاولة.");
}
