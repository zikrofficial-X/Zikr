import { NextRequest, NextResponse } from "next/server";
import { getAyahFromDb } from "@/features/quran/services/quran-server";
import { normalizeDifficulty } from "@/lib/games/registry";
import { getVersePuzzleReference } from "@/lib/games/verse-puzzle";

export async function GET(request: NextRequest) {
  const difficulty = normalizeDifficulty(
    request.nextUrl.searchParams.get("difficulty"),
  );
  const requestedLevel = Number(request.nextUrl.searchParams.get("level") ?? "0");
  const levelIndex = Number.isInteger(requestedLevel) ? requestedLevel : 0;
  const reference = getVersePuzzleReference(difficulty, levelIndex);
  const ayah = await getAyahFromDb(reference.surah, reference.ayah, "ar");

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
    surah: reference.surah,
    ayah: reference.ayah,
    sourceText,
    words,
  });
}
