import { NextRequest, NextResponse } from "next/server";
import { getAyahFromDb } from "@/features/quran/services/quran-server";

export async function GET(request: NextRequest) {
  const difficulty = request.nextUrl.searchParams.get("difficulty") ?? "easy";
  const ayah = await getAyahFromDb(1, difficulty === "hard" ? 2 : 1, "ar");
  if (!ayah?.text?.trim()) return NextResponse.json({ error: "Verified Quran text is unavailable" }, { status: 503 });
  const sourceText = ayah.text.trim();
  const words = sourceText.split(/\s+/).filter(Boolean);
  return NextResponse.json({ surah: 1, ayah: difficulty === "hard" ? 2 : 1, sourceText, words });
}
