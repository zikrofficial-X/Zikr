import { NextRequest, NextResponse } from "next/server";
import { getAyahFromDb } from "@/features/quran/services/quran-server";
import { normalizeDifficulty } from "@/lib/games/registry";
import { getVersePuzzleAyah } from "@/lib/games/verse-puzzle";

export async function GET(request: NextRequest) {
  const difficulty = normalizeDifficulty(
    request.nextUrl.searchParams.get("difficulty"),
  );
  const ayahNumber = getVersePuzzleAyah(difficulty);
  const ayah = await getAyahFromDb(1, ayahNumber, "ar");

  if (!ayah?.text?.trim()) {
    return NextResponse.json(
      { error: "Verified Quran text is unavailable" },
      { status: 503 },
    );
  }

  const sourceText = ayah.text.trim();
  const words = sourceText.split(/\s+/).filter(Boolean);

  return NextResponse.json({
    difficulty,
    surah: 1,
    ayah: ayahNumber,
    sourceText,
    words,
  });
}
