import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET = "youtube-facebook-media";
const SAFETY_DELAY_MS = 10 * 60 * 1000;
const MAX_BATCH = 25;

function sha256Hex(value: string) {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(value))
    .then((buffer) =>
      Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join(""),
    );
}

export async function POST(request: Request) {
  try {
    const supplied = request.headers.get("x-zikr-sync-secret")?.trim() ?? "";
    if (!supplied) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createAdminClient();
    const { data: state, error: stateError } = await supabase
      .from("social_sync_state")
      .select("sync_secret_hash")
      .eq("id", 1)
      .maybeSingle();

    if (stateError) throw stateError;
    if (!state?.sync_secret_hash || (await sha256Hex(supplied)) !== state.sync_secret_hash) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - SAFETY_DELAY_MS).toISOString();
    const { data: jobs, error: queryError } = await supabase
      .from("social_sync_jobs")
      .select("id,source_media_path,source_media_uploaded_at,facebook_post_id")
      .eq("status", "published")
      .not("facebook_post_id", "is", null)
      .not("source_media_path", "is", null)
      .is("source_media_deleted_at", null)
      .lte("source_media_uploaded_at", cutoff)
      .order("source_media_uploaded_at", { ascending: true })
      .limit(MAX_BATCH);

    if (queryError) throw queryError;

    let deleted = 0;
    let failed = 0;

    for (const job of jobs ?? []) {
      const path = String(job.source_media_path ?? "").trim();
      if (!path.startsWith("imports/") || path.includes("..")) {
        failed += 1;
        await supabase
          .from("social_sync_jobs")
          .update({
            source_media_delete_error: "Invalid storage path; manual cleanup required.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id)
          .eq("status", "published");
        continue;
      }

      const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
      if (removeError) {
        failed += 1;
        await supabase
          .from("social_sync_jobs")
          .update({
            source_media_delete_error: removeError.message.slice(0, 2000),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id)
          .eq("status", "published");
        continue;
      }

      const { error: markError } = await supabase
        .from("social_sync_jobs")
        .update({
          source_media_path: null,
          source_media_url: null,
          source_media_deleted_at: new Date().toISOString(),
          source_media_delete_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("status", "published")
        .not("facebook_post_id", "is", null)
        .is("source_media_deleted_at", null);

      if (markError) {
        failed += 1;
        await supabase
          .from("social_sync_jobs")
          .update({
            source_media_delete_error: markError.message.slice(0, 2000),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id)
          .eq("status", "published");
        continue;
      }

      deleted += 1;
    }

    return NextResponse.json({
      ok: true,
      scanned: jobs?.length ?? 0,
      deleted,
      failed,
      safetyDelayMinutes: 10,
    });
  } catch (error) {
    console.error("[youtube-facebook/cleanup-media] unexpected error", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
