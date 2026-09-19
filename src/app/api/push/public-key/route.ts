import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Returns the application-server public key required by PushManager.subscribe().
 * The matching private VAPID key remains in a service-role-only database record.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Push delivery is unavailable." },
      { status: 503 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("get_push_vapid_public_key");
    if (error) throw error;

    if (typeof data !== "string" || data.length === 0) {
      // The scheduled worker provisions the key pair on its first safe run.
      return NextResponse.json(
        { error: "Push delivery is initializing." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { publicKey: data },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (error) {
    console.error("[push] Failed to read VAPID public key:", error);
    return NextResponse.json(
      { error: "Push delivery is unavailable." },
      { status: 503 }
    );
  }
}
