import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import {
  listVideoSources,
  resolveVideoSource,
} from "@/features/videos/services/video-sources";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi("video.manage");
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const params = request.nextUrl.searchParams;
    const category = params.get("category") ?? "";
    if (!["quran", "hadith", "story", "dua", "adhkar"].includes(category)) {
      return NextResponse.json(
        { error: "نوع مصدر المحتوى غير صالح." },
        { status: 400 }
      );
    }

    if (category === "quran") {
      const surahId = Number(params.get("surahId"));
      const ayahNumber = Number(params.get("ayahNumber"));
      if (!Number.isInteger(surahId) || !Number.isInteger(ayahNumber)) {
        return NextResponse.json(
          { error: "أدخل رقم السورة والآية لتحميل النص من المصحف المعتمد." },
          { status: 400 }
        );
      }
      const source = await resolveVideoSource(
        category,
        `quran:${surahId}:${ayahNumber}`
      );
      if (!source)
        return NextResponse.json(
          { error: "لم نعثر على هذه الآية في المصحف المخزن." },
          { status: 404 }
        );
      return NextResponse.json(
        { source },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const sources = await listVideoSources(category);
    return NextResponse.json(
      { sources },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[api/admin/video-generation/sources] GET:", error);
    return NextResponse.json(
      { error: "تعذر تحميل مصادر المحتوى المنشورة." },
      { status: 500 }
    );
  }
}
