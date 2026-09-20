import { getQuranAudioFromDb } from "@/features/quran/services/quran-server";
import { NextResponse } from "next/server";

export const revalidate = 86400;

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
  if (!/^[a-z0-9.-]{2,120}$/i.test(reciter)) {
    return json({ error: "Invalid reciter" }, 400);
  }

  try {
    const result = await getQuranAudioFromDb(surah, reciter);
    if (result.audio) {
      return json(result);
    }

    return json({
      audio: null,
      reason: result.reason,
      storage_path: result.storage_path,
    });
  } catch (error) {
    console.error(
      "[api/quran/audio] canonical Supabase audio unavailable:",
      error,
    );
    return json(
      { audio: null, reason: "storage_unavailable" },
      503,
    );
  }
}
