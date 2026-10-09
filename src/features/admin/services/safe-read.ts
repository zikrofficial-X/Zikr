import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export type AdminRead<T> = { rows: T[]; ok: boolean };

type AdminRequestInit = Parameters<typeof supabaseServerAdminRequest>[1];

/**
 * Reads rows for an admin page without hiding failures. A failed read returns
 * `ok: false` so the page can say "unavailable" instead of rendering an empty
 * list or a zero count that looks like real data.
 */
export async function readAdminRows<T>(path: string, init?: AdminRequestInit): Promise<AdminRead<T>> {
  try {
    const rows = await supabaseServerAdminRequest<T[]>(path, init ?? { method: "GET" });
    return { rows: rows ?? [], ok: true };
  } catch (error) {
    console.error("[admin] read failed:", path.split("?")[0], error);
    return { rows: [], ok: false };
  }
}
