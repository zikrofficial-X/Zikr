import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const revalidate = 86400;

type AudioRow = {
  audio_url: string | null;
  source_url: string | null;
  retrieved_at: string | null;
  storage_url: string | null;
  storage_status: "pending" | "uploading" | "ready" | "failed" | null;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const surah = Number.parseInt(url.searchParams.get("surah") ?? "", 10);
  const reciter = (url.searchParams.get("reciter") ?? "").trim();

  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return json({ error: "Invalid surah" }, 400);
  }
  if (!/^[a-z0-9.-]{2,80}$/i.test(reciter)) {
    return json({ error: "Invalid reciter" }, 400);
  }

  try {
    const supabase = await createClient();

    const candidates = [...new Set([
      reciter,
      reciter.replace(/^ar\./i, ""),
      `ar.${reciter.replace(/^ar\./i, "")}`,
    ])];

    const { data: reciters, error: reciterError } = await supabase
      .from("quran_reciters")
      .select("id,code")
      .in("code", candidates)
      .limit(10);

    if (reciterError) throw reciterError;
    const reciterRow = reciters?.find(row => candidates.includes(row.code ?? ""));
    if (!reciterRow?.id) return json({ audio: null, reason: "reciter_not_found" });

    const { data: audio, error: audioError } = await supabase
      .from("quran_audio")
      .select("audio_url,source_url,retrieved_at,storage_url,storage_status")
      .eq("surah_id", surah)
      .eq("reciter_id", reciterRow.id)
      .limit(1)
      .maybeSingle();

    if (audioError) throw audioError;
    const row = audio as AudioRow | null;

    if (row?.storage_status === "ready" && row.storage_url) {
      return json({ audio: row });
    }

    return json({
      audio: null,
      reason: row?.storage_status ?? "not_imported",
    });
  } catch (error) {
    console.error("[api/quran/audio] canonical Supabase audio unavailable:", error);
    return json({ audio: null, reason: "storage_unavailable" }, 503);
  }
}
