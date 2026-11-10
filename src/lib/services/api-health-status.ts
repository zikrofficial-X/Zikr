export type ApiHealthStatus = "ok" | "warning" | "error";

export type ApiHealthCheck = {
  name: string;
  status: ApiHealthStatus;
  message: string;
};

/**
 * Convert the actual Supabase data-plane probe result into a health status.
 * A configured URL/key is not evidence that the REST endpoint is reachable.
 */
export function createSupabaseHealthCheck(connected: boolean): ApiHealthCheck {
  return connected
    ? {
        name: "Supabase Auth/REST",
        status: "ok",
        message: "Supabase URL and anon key responded successfully.",
      }
    : {
        name: "Supabase Auth/REST",
        status: "error",
        message: "Supabase URL/key are configured, but the data-plane probe did not respond successfully.",
      };
}
