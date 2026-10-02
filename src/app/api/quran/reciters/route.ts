import { NextResponse } from "next/server";

import { getRecitersFromDb } from "@/features/quran/services/quran-server";
import type { Reciter } from "@/features/quran/types/quran";
import { reciters as fallbackReciters } from "@/features/quran/data/fallback";

export const revalidate = 86400;

function getFallbackReciters(): Reciter[] {
  return fallbackReciters.map((reciter) => ({
    id: reciter.id,
    nameAr: reciter.nameAr,
    nameEn: reciter.nameEn,
    code: reciter.code,
    baseUrlTemplate: reciter.baseUrlTemplate,
    type: reciter.type,
  }));
}

export async function GET() {
  const reciters = (await getRecitersFromDb()) ?? getFallbackReciters();

  return NextResponse.json(
    { reciters },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
